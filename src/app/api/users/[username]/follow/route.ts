import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/users/[username]/follow — toggle follow
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })

  const target = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, username: true, displayName: true } })
  if (!target) return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })
  if (target.id === me.id) return NextResponse.json({ error: 'Não podes seguir-te a ti próprio.' }, { status: 400 })

  const existing = await db.follow.findUnique({
    where: { followerId_followeeId: { followerId: me.id, followeeId: target.id } },
  })
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  }

  await db.follow.create({ data: { followerId: me.id, followeeId: target.id } })

  // notify the followed user (respects notifyOnFollow pref)
  const { maybeCreateNotification } = await import('@/lib/notification-prefs')
  await maybeCreateNotification({
    userId: target.id,
    pref: 'notifyOnFollow',
    type: 'follow',
    title: 'Novo seguidor 👋',
    body: `${me.displayName || me.username} começou a seguir-te.`,
    link: `user:${me.username}`,
  })

  return NextResponse.json({ following: true })
}

// GET /api/users/[username]/follow — check if current user follows
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ following: false })

  const target = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } })
  if (!target) return NextResponse.json({ following: false })

  const existing = await db.follow.findUnique({
    where: { followerId_followeeId: { followerId: me.id, followeeId: target.id } },
  })
  return NextResponse.json({ following: !!existing })
}
