import { getCurrentUser, type SessionUser } from '@/lib/auth'

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}
