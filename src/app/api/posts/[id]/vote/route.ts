import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { recomputePostScore, adjustUserKarma } from '@/lib/post-helpers'

// POST /api/posts/[id]/vote  body: { value: 1 | -1 | 0 }
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

  const post = await db.post.findUnique({ where: { id }, select: { id: true, authorId: true } })
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })

  const existing = await db.vote.findUnique({
    where: { userId_postId: { userId: user.id, postId: id } },
  })

  let finalVote = 0

  if (value === 0 || (existing && existing.value === value)) {
    // remove the vote
    if (existing) {
      await db.vote.delete({ where: { id: existing.id } })
      if (existing.value === 1) {
        await db.post.update({ where: { id }, data: { upvotes: { decrement: 1 } } })
        await adjustUserKarma(post.authorId, -1)
      } else {
        await db.post.update({ where: { id }, data: { downvotes: { decrement: 1 } } })
        await adjustUserKarma(post.authorId, 1)
      }
    }
    finalVote = 0
  } else if (existing) {
    // change vote direction
    await db.vote.update({ where: { id: existing.id }, data: { value } })
    if (value === 1) {
      await db.post.update({ where: { id }, data: { upvotes: { increment: 1 }, downvotes: { decrement: 1 } } })
      await adjustUserKarma(post.authorId, 2)
    } else {
      await db.post.update({ where: { id }, data: { downvotes: { increment: 1 }, upvotes: { decrement: 1 } } })
      await adjustUserKarma(post.authorId, -2)
    }
    finalVote = value
  } else {
    // new vote
    await db.vote.create({ data: { userId: user.id, postId: id, value } })
    if (value === 1) {
      await db.post.update({ where: { id }, data: { upvotes: { increment: 1 } } })
      await adjustUserKarma(post.authorId, 1)
      if (post.authorId !== user.id) {
        const { maybeCreateNotification } = await import('@/lib/notification-prefs')
        await maybeCreateNotification({
          userId: post.authorId,
          pref: 'notifyOnVote',
          type: 'vote',
          title: 'Recebeste um voto positivo 👍',
          body: 'A tua publicação recebeu um voto a favor.',
          link: `post:${id}`,
        })
      }
    } else {
      await db.post.update({ where: { id }, data: { downvotes: { increment: 1 } } })
      await adjustUserKarma(post.authorId, -1)
    }
    finalVote = value
  }

  await recomputePostScore(id)

  // award badges to the post author when they receive upvotes (best-effort)
  if (finalVote === 1 && post.authorId !== user.id) {
    const { awardBadges } = await import('@/lib/badges')
    await awardBadges(post.authorId)
  }

  const updated = await db.post.findUnique({ where: { id }, select: { upvotes: true, downvotes: true, score: true } })
  return NextResponse.json({
    userVote: finalVote,
    upvotes: updated?.upvotes ?? 0,
    downvotes: updated?.downvotes ?? 0,
    score: updated?.score ?? 0,
  })
}
