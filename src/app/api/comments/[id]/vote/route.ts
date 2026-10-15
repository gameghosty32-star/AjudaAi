import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { recomputeCommentScore, adjustUserKarma } from '@/lib/post-helpers'

// POST /api/comments/[id]/vote  body: { value: 1 | -1 | 0 }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })

  const { value } = await req.json()
  if (![1, -1, 0].includes(value)) {
    return NextResponse.json({ error: 'Voto inválido.' }, { status: 400 })
  }

  const comment = await db.comment.findUnique({ where: { id }, select: { id: true, authorId: true } })
  if (!comment) return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })

  const existing = await db.vote.findUnique({
    where: { userId_commentId: { userId: user.id, commentId: id } },
  })

  let finalVote = 0

  if (value === 0 || (existing && existing.value === value)) {
    if (existing) {
      await db.vote.delete({ where: { id: existing.id } })
      if (existing.value === 1) {
        await db.comment.update({ where: { id }, data: { upvotes: { decrement: 1 } } })
        await adjustUserKarma(comment.authorId, -1)
      } else {
        await db.comment.update({ where: { id }, data: { downvotes: { decrement: 1 } } })
        await adjustUserKarma(comment.authorId, 1)
      }
    }
    finalVote = 0
  } else if (existing) {
    await db.vote.update({ where: { id: existing.id }, data: { value } })
    if (value === 1) {
      await db.comment.update({ where: { id }, data: { upvotes: { increment: 1 }, downvotes: { decrement: 1 } } })
      await adjustUserKarma(comment.authorId, 2)
    } else {
      await db.comment.update({ where: { id }, data: { downvotes: { increment: 1 }, upvotes: { decrement: 1 } } })
      await adjustUserKarma(comment.authorId, -2)
    }
    finalVote = value
  } else {
    await db.vote.create({ data: { userId: user.id, commentId: id, value } })
    if (value === 1) {
      await db.comment.update({ where: { id }, data: { upvotes: { increment: 1 } } })
      await adjustUserKarma(comment.authorId, 1)
      if (comment.authorId !== user.id) {
        const { maybeCreateNotification } = await import('@/lib/notification-prefs')
        await maybeCreateNotification({
          userId: comment.authorId,
          pref: 'notifyOnVote',
          type: 'vote',
          title: 'Recebeste um voto positivo 👍',
          body: 'O teu comentário recebeu um voto a favor.',
          link: `comment:${id}`,
        })
      }
    } else {
      await db.comment.update({ where: { id }, data: { downvotes: { increment: 1 } } })
      await adjustUserKarma(comment.authorId, -1)
    }
    finalVote = value
  }

  await recomputeCommentScore(id)
  const updated = await db.comment.findUnique({ where: { id }, select: { upvotes: true, downvotes: true, score: true } })
  return NextResponse.json({
    userVote: finalVote,
    upvotes: updated?.upvotes ?? 0,
    downvotes: updated?.downvotes ?? 0,
    score: updated?.score ?? 0,
  })
}
