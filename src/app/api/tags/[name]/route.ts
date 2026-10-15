import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/tags/[name] — posts with this tag
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const tag = await db.tag.findUnique({ where: { name: name.toLowerCase() } })
  if (!tag) return NextResponse.json({ posts: [], nextCursor: null, tag: null })

  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') || 'hot'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)

  let orderBy: Record<string, 'asc' | 'desc'>[] = [{ createdAt: 'desc' }]
  if (sort === 'hot') orderBy = [{ hotScore: 'desc' }, { createdAt: 'desc' }]
  if (sort === 'top') orderBy = [{ score: 'desc' }, { createdAt: 'desc' }]
  if (sort === 'new') orderBy = [{ createdAt: 'desc' }]
  if (sort === 'rising') orderBy = [{ upvotes: 'desc' }, { createdAt: 'desc' }]

  const postTags = await db.postTag.findMany({
    where: { tagId: tag.id },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { post: { createdAt: 'desc' } as any },
    include: {
      post: {
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
          community: { select: { id: true, slug: true, name: true, color: true, icon: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  })

  const posts = postTags.map((pt) => pt.post)
  const postIds = posts.map((p) => p.id)

  const user = await getCurrentUser()
  let voteMap: Record<string, number> = {}
  let savedSet: Set<string> = new Set()
  if (user && postIds.length) {
    const [votes, saved] = await Promise.all([
      db.vote.findMany({ where: { userId: user.id, postId: { in: postIds } }, select: { postId: true, value: true } }),
      db.savedPost.findMany({ where: { userId: user.id, postId: { in: postIds } }, select: { postId: true } }),
    ])
    voteMap = Object.fromEntries(votes.map((v) => [v.postId, v.value]))
    savedSet = new Set(saved.map((s) => s.postId))
  }

  const hasMore = posts.length > limit
  const slice = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? postTags[limit - 1]?.id : null

  return NextResponse.json({
    tag: { name: tag.name },
    posts: slice.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      image: p.image,
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
