import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'

async function deleteImageFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return
  const match = imageUrl.match(/\/api\/uploads\/(.+)$/)
  if (!match) return
  const filepath = path.join(process.cwd(), 'upload', match[1])
  try { await unlink(filepath) } catch {}
}

// PATCH /api/comments/[id] — edit own comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const comment = await db.comment.findUnique({ where: { id }, select: { id: true, authorId: true, body: true } })
  if (!comment) return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })
  if (comment.authorId !== user.id) {
    return NextResponse.json({ error: 'Só podes editar os teus próprios comentários.' }, { status: 403 })
  }

  const { body, image } = await req.json()
  if (!body || body.trim().length < 1) {
    return NextResponse.json({ error: 'Comentário vazio.' }, { status: 400 })
  }

  const data: any = { body: body.trim().slice(0, 4000), edited: true }
  if (typeof image === 'string') data.image = image.trim() || null

  const updated = await db.comment.update({
    where: { id },
    data,
    select: { id: true, body: true, image: true, edited: true, updatedAt: true },
  })
  return NextResponse.json({ comment: updated })
}

// DELETE /api/comments/[id] — delete own comment
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const comment = await db.comment.findUnique({
    where: { id },
    select: { id: true, authorId: true, postId: true, isAnswer: true, image: true },
  })
  if (!comment) return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })
  if (comment.authorId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  await deleteImageFile(comment.image)
  await db.comment.delete({ where: { id } })
  // decrement post answer count
  await db.post.update({
    where: { id: comment.postId },
    data: { answerCount: { decrement: 1 } },
  }).catch(() => null)
  return NextResponse.json({ ok: true })
}
