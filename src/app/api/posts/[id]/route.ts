import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { fetchPostById } from '@/lib/post-helpers'
import { unlink } from 'fs/promises'
import path from 'path'

async function deleteImageFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return
  const match = imageUrl.match(/\/api\/uploads\/(.+)$/)
  if (!match) return
  const filepath = path.join(process.cwd(), 'upload', match[1])
  try { await unlink(filepath) } catch {}
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  // increment views
  await db.post.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => null)
  const post = await fetchPostById(id, user?.id)
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })
  return NextResponse.json({ post })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const post = await db.post.findUnique({
    where: { id },
    select: { authorId: true, image: true, comments: { select: { image: true } } },
  })
  if (!post) return NextResponse.json({ error: 'Não encontrada.' }, { status: 404 })
  if (post.authorId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }
  // cleanup image files (post + comments)
  await deleteImageFile(post.image)
  for (const c of post.comments) await deleteImageFile(c.image)
  await db.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// PATCH — edit own post (title/body/link)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const post = await db.post.findUnique({ where: { id }, select: { authorId: true, type: true } })
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })
  if (post.authorId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Só podes editar as tuas próprias publicações.' }, { status: 403 })
  }
  const body = await req.json()
  const { title, body: postBody, link, image } = body || {}
  const data: any = { edited: true }
  if (typeof title === 'string' && title.trim().length >= 5) data.title = title.trim().slice(0, 200)
  if (typeof postBody === 'string') data.body = postBody.trim().slice(0, 8000) || null
  if (typeof link === 'string' && post.type === 'link') data.link = link.trim() || null
  if (typeof image === 'string') data.image = image.trim() || null
  const updated = await db.post.update({ where: { id }, data, select: { id: true, title: true, body: true, link: true, image: true, edited: true, updatedAt: true } })
  return NextResponse.json({ post: updated })
}

