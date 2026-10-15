import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/users — list all users with pagination
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: any = {}
  if (q) {
    where.OR = [
      { username: { contains: q } },
      { email: { contains: q } },
      { displayName: { contains: q } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true, username: true, email: true, displayName: true, avatarColor: true,
        location: true, karma: true, role: true, createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({
    users: users.map((u) => ({ ...u, postCount: u._count.posts, commentCount: u._count.comments, _count: undefined })),
    total,
  })
}

// PATCH /api/admin/users — update user role (promote/demote)
export async function PATCH(req: NextRequest) {
  try {
    const me = await requireAdmin()
    const { userId, role } = await req.json()
    if (!userId || !['member', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    if (userId === me.id && role !== 'admin') {
      return NextResponse.json({ error: 'Não podes remover o teu próprio privilégio de admin.' }, { status: 400 })
    }
    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true },
    })
    return NextResponse.json({ user: updated })
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
}

// DELETE /api/admin/users — ban/delete a user
export async function DELETE(req: NextRequest) {
  try {
    const me = await requireAdmin()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId em falta.' }, { status: 400 })
    if (userId === me.id) return NextResponse.json({ error: 'Não podes apagar a tua própria conta.' }, { status: 400 })
    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
}
