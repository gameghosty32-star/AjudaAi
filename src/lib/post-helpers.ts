import { db } from '@/lib/db'

// Reddit-style hot ranking (simplified)
export function hotScore(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1))
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0
  const seconds = (createdAt.getTime() - 1577836800000) / 1000 // epoch offset 2020-01-01
  return sign * order + seconds / 45000
}

export async function recomputePostScore(postId: string) {
  const post = await db.post.findUnique({ where: { id: postId } })
  if (!post) return
  const score = post.upvotes - post.downvotes
  await db.post.update({
    where: { id: postId },
    data: { score, hotScore: hotScore(score, post.createdAt) },
  })
}

export async function recomputeCommentScore(commentId: string) {
  const c = await db.comment.findUnique({ where: { id: commentId } })
  if (!c) return
  const score = c.upvotes - c.downvotes
  await db.comment.update({ where: { id: commentId }, data: { score } })
}

export async function adjustUserKarma(userId: string, delta: number) {
  await db.user.update({
    where: { id: userId },
    data: { karma: { increment: delta } },
  })
}

export type PostWithRelations = Awaited<ReturnType<typeof fetchPostById>>

export async function fetchPostById(id: string, currentUserId?: string) {
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: true,
      community: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
  })
  if (!post) return null

  let userVote = 0
  if (currentUserId) {
    const v = await db.vote.findUnique({
      where: { userId_postId: { userId: currentUserId, postId: id } },
    })
    userVote = v?.value || 0
  }

  let saved = false
  if (currentUserId) {
    const s = await db.savedPost.findUnique({
      where: { userId_postId: { userId: currentUserId, postId: id } },
    })
    saved = !!s
  }

  return {
    ...post,
    userVote,
    saved,
    tags: post.tags.map((t) => t.tag.name),
  }
}
