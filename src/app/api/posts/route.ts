import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hotScore } from '@/lib/post-helpers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') || 'hot' // hot | new | top | rising
  const communitySlug = searchParams.get('community')
  const type = searchParams.get('type') // question | discussion | link
  const q = searchParams.get('q')?.trim()
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)

  const where: Record<string, unknown> = {}
  if (communitySlug) {
    const c = await db.community.findUnique({ where: { slug: communitySlug }, select: { id: true } })
    if (!c) return NextResponse.json({ posts: [], nextCursor: null })
    where.communityId = c.id
  }
  if (type) where.type = type
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
    ]
  }

  let orderBy: Record<string, 'asc' | 'desc'>[] = [{ createdAt: 'desc' }]
  if (sort === 'hot') orderBy = [{ hotScore: 'desc' }, { createdAt: 'desc' }]
  if (sort === 'top') orderBy = [{ score: 'desc' }, { createdAt: 'desc' }]
  if (sort === 'new') orderBy = [{ createdAt: 'desc' }]
  if (sort === 'rising') orderBy = [{ upvotes: 'desc' }, { createdAt: 'desc' }]

  const posts = await db.post.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
      community: { select: { id: true, slug: true, name: true, color: true, icon: true } },
      _count: { select: { comments: true } },
    },
  })

  const user = await getCurrentUser()
  let voteMap: Record<string, number> = {}
  let savedSet: Set<string> = new Set()
  if (user && posts.length) {
    const votes = await db.vote.findMany({
      where: { userId: user.id, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true, value: true },
    })
    voteMap = Object.fromEntries(votes.map((v) => [v.postId, v.value]))
    const saved = await db.savedPost.findMany({
      where: { userId: user.id, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    })
    savedSet = new Set(saved.map((s) => s.postId))
  }

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
      image: p.image,
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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })
  try {
    const body = await req.json()
    const { communitySlug, type, title, body: postBody, link, image, tags } = body || {}
    if (!title || title.trim().length < 5) {
      return NextResponse.json({ error: 'Título muito curto (mín. 5 caracteres).' }, { status: 400 })
    }
    if (!communitySlug) {
      return NextResponse.json({ error: 'Escolha uma comunidade.' }, { status: 400 })
    }
    const community = await db.community.findUnique({ where: { slug: communitySlug } })
    if (!community) return NextResponse.json({ error: 'Comunidade inválida.' }, { status: 400 })

    const postType = ['question', 'discussion', 'link'].includes(type) ? type : 'question'
    if (postType === 'link' && !link) {
      return NextResponse.json({ error: 'Indique um link.' }, { status: 400 })
    }

    const post = await db.post.create({
      data: {
        type: postType,
        title: title.trim(),
        body: postBody?.trim() || null,
        link: link || null,
        image: image || null,
        communityId: community.id,
        authorId: user.id,
        hotScore: hotScore(1, new Date()),
      },
    })

    // tags
    if (Array.isArray(tags)) {
      const cleanTags = tags
        .map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9áàâãéêíóôõúçñ-]+/g, ''))
        .filter(Boolean)
        .slice(0, 5)
      for (const name of cleanTags) {
        const tag = await db.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
        await db.postTag.upsert({
          where: { postId_tagId: { postId: post.id, tagId: tag.id } },
          update: {},
          create: { postId: post.id, tagId: tag.id },
        })
      }
    }

    // notify community members (best-effort, limited)
    const members = await db.membership.findMany({
      where: { communityId: community.id, userId: { not: user.id } },
      take: 100,
      select: { userId: true },
    })
    if (members.length) {
      await db.notification.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          type: 'post',
          title: `Nova publicação em ${community.name}`,
          body: title.trim().slice(0, 140),
          link: `post:${post.id}`,
        })),
      })
    }

    // award badges (best-effort)
    const { awardBadges } = await import('@/lib/badges')
    const newBadges = await awardBadges(user.id)

    return NextResponse.json({ id: post.id, newBadges })
  } catch (e) {
    console.error('[post create] error', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
