import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

const SESSION_COOKIE = 'ajudai_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export type SessionUser = {
  id: string
  username: string
  displayName: string | null
  email: string
  avatarColor: string
  karma: number
  role: string
  location: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = nanoid(48)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.session.create({
    data: { userId, token, expiresAt },
  })
  return token
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + SESSION_TTL_MS),
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export function getSessionCookie(): string | undefined {
  // cookie() must be awaited in Next 15+, but for sync reads in route handlers we use the store
  return undefined
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) {
      await db.session.delete({ where: { id: session.id } })
      return null
    }
    const u = session.user
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      avatarColor: u.avatarColor,
      karma: u.karma,
      role: u.role,
      location: u.location,
    }
  } catch {
    return null
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { token } })
}

// Helper for route handlers to read the token from the request cookies directly
export function readTokenFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

export async function getUserFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }
  const u = session.user
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    avatarColor: u.avatarColor,
    karma: u.karma,
    role: u.role,
    location: u.location,
  }
}
