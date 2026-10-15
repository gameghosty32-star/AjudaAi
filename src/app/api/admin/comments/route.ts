import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/comments — list all comments (paginated, searchable)
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
    where.body = { contains: q }
  }

  const [comments, total] = await Promise.all([
    db.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true, body: true, score: true, isAnswer: true, createdAt: true,
        author: { select: { id: true, username: true, displayName: true } },
        post: { select: { id: true, title: true } },
      },
    }),
    db.comment.count({ where }),
  ])

  return NextResponse.json({ comments, total })
}

// DELETE /api/admin/comments — delete any comment
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('commentId')
    if (!commentId) return NextResponse.json({ error: 'commentId em falta.' }, { status: 400 })
    await db.comment.delete({ where: { id: commentId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
}
