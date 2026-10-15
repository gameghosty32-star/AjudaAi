import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/posts/following — posts from users the current user follows
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ posts: [], nextCursor: null, requiresAuth: true })

  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') || 'hot'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)

  const follows = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  })
  const followeeIds = follows.map((f) => f.followeeId)
  if (followeeIds.length === 0) {
    return NextResponse.json({ posts: [], nextCursor: null, empty: true })
  }

  let orderBy: Record<string, 'asc' | 'desc'>[] = [{ createdAt: 'desc' }]
  if (sort === 'hot') orderBy = [{ hotScore: 'desc' }, { createdAt: 'desc' }]
  if (sort === 'top') orderBy = [{ score: 'desc' }, { createdAt: 'desc' }]
  if (sort === 'new') orderBy = [{ createdAt: 'desc' }]
  if (sort === 'rising') orderBy = [{ upvotes: 'desc' }, { createdAt: 'desc' }]

  const posts = await db.post.findMany({
    where: { authorId: { in: followeeIds } },
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
      community: { select: { id: true, slug: true, name: true, color: true, icon: true } },
      _count: { select: { comments: true } },
    },
  })

  // votes + saved for current user
  const [votes, saved] = await Promise.all([
    db.vote.findMany({ where: { userId: user.id, postId: { in: posts.map((p) => p.id) } }, select: { postId: true, value: true } }),
    db.savedPost.findMany({ where: { userId: user.id, postId: { in: posts.map((p) => p.id) } }, select: { postId: true } }),
  ])
  const voteMap = Object.fromEntries(votes.map((v) => [v.postId, v.value]))
  const savedSet = new Set(saved.map((s) => s.postId))

  const hasMore = posts.length > limit
  const slice = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? slice[slice.length - 1].id : null

  return NextResponse.json({
    posts: slice.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      link: p.link,
      score: p.score,
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      views: p.views,
      answerCount: p.answerCount,
      commentCount: p._count.comments,
      createdAt: p.createdAt,
      author: p.author,
      community: p.community,
      userVote: voteMap[p.id] || 0,
      saved: savedSet.has(p.id),
    })),
    nextCursor,
  })
}
