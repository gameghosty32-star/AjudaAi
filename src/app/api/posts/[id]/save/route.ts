import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/posts/[id]/save — toggle save (bookmark)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })
  const post = await db.post.findUnique({ where: { id }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })

  const existing = await db.savedPost.findUnique({
    where: { userId_postId: { userId: user.id, postId: id } },
  })
  if (existing) {
    await db.savedPost.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false })
  }
  await db.savedPost.create({ data: { userId: user.id, postId: id } })
  return NextResponse.json({ saved: true })
}

// GET /api/posts/[id]/save — check saved status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ saved: false })
  const existing = await db.savedPost.findUnique({
    where: { userId_postId: { userId: user.id, postId: id } },
  })
  return NextResponse.json({ saved: !!existing })
}
