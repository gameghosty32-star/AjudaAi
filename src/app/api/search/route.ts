import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)
  const type = searchParams.get('type') // question | discussion | link
  const communitySlug = searchParams.get('community')
  const sort = searchParams.get('sort') || 'top' // top | new

  if (q.length < 2) {
    return NextResponse.json({ posts: [], communities: [], users: [], nextCursor: null })
  }

  // resolve community slug to id if provided
  let communityId: string | undefined
  if (communitySlug) {
    const c = await db.community.findUnique({ where: { slug: communitySlug }, select: { id: true } })
    communityId = c?.id
    if (!communityId) {
      return NextResponse.json({ posts: [], communities: [], users: [], nextCursor: null })
    }
  }

  const postWhere: any = {
    OR: [{ title: { contains: q } }, { body: { contains: q } }],
  }
  if (type) postWhere.type = type
  if (communityId) postWhere.communityId = communityId

  const postOrderBy =
    sort === 'new'
      ? [{ createdAt: 'desc' as const }]
      : [{ score: 'desc' as const }, { createdAt: 'desc' as const }]

  const [posts, communities, users] = await Promise.all([
    db.post.findMany({
      where: postWhere,
      orderBy: postOrderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
        community: { select: { id: true, slug: true, name: true, color: true, icon: true } },
        _count: { select: { comments: true } },
      },
    }),
    db.community.findMany({
      where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
      take: 10,
    }),
    db.user.findMany({
      where: { OR: [{ username: { contains: q } }, { displayName: { contains: q } }] },
      take: 10,
      select: { id: true, username: true, displayName: true, avatarColor: true, karma: true, location: true },
    }),
  ])

  const hasMore = posts.length > limit
  const slice = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? slice[slice.length - 1].id : null

  return NextResponse.json({
    posts: slice.map((p) => ({
      id: p.id, title: p.title, type: p.type, score: p.score,
      createdAt: p.createdAt, commentCount: p._count.comments,
      author: p.author, community: p.community,
    })),
    communities,
    users,
    nextCursor,
  })
}
