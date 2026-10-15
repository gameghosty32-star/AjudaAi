import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/posts — list all posts (paginated, searchable)
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
    where.OR = [{ title: { contains: q } }, { body: { contains: q } }]
  }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true, title: true, type: true, score: true, createdAt: true, views: true,
        author: { select: { id: true, username: true, displayName: true } },
        community: { select: { id: true, slug: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    db.post.count({ where }),
  ])

  return NextResponse.json({
    posts: posts.map((p) => ({ ...p, commentCount: p._count.comments, _count: undefined })),
    total,
  })
}

// DELETE /api/admin/posts — delete any post
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId em falta.' }, { status: 400 })
    await db.post.delete({ where: { id: postId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
}
