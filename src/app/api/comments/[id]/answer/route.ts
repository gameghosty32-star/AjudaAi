import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { adjustUserKarma } from '@/lib/post-helpers'

// POST /api/comments/[id]/answer  — mark/unmark best answer (only post author)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })

  const comment = await db.comment.findUnique({
    where: { id },
    select: { id: true, postId: true, authorId: true, isAnswer: true },
  })
  if (!comment) return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })

  const post = await db.post.findUnique({ where: { id: comment.postId }, select: { id: true, authorId: true } })
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })
  if (post.authorId !== user.id) {
    return NextResponse.json({ error: 'Apenas o autor da pergunta pode escolher a melhor resposta.' }, { status: 403 })
  }

  // unmark any existing answer on this post
  const previous = await db.comment.findFirst({ where: { postId: post.id, isAnswer: true } })
  if (previous && previous.id !== comment.id) {
    await db.comment.update({ where: { id: previous.id }, data: { isAnswer: false } })
    await adjustUserKarma(previous.authorId, -15)
  }

  const newState = !comment.isAnswer
  await db.comment.update({ where: { id }, data: { isAnswer: newState } })
  await adjustUserKarma(comment.authorId, newState ? 15 : -15)

  if (newState && comment.authorId !== user.id) {
    const { maybeCreateNotification } = await import('@/lib/notification-prefs')
    await maybeCreateNotification({
      userId: comment.authorId,
      pref: 'notifyOnAnswer',
      type: 'answer',
      title: '🎉 A tua resposta foi escolhida como a melhor!',
      body: 'Parabéns! Recebeste +15 de karma.',
      link: `post:${post.id}`,
    })
  }

  return NextResponse.json({ isAnswer: newState })
}
