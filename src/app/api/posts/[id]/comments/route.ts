import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({ where: { id }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') || 'top' // top | new
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  // best answer always first; then sort by requested order
  const rootOrderBy =
    sort === 'new'
      ? [{ isAnswer: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ isAnswer: 'desc' as const }, { score: 'desc' as const }, { createdAt: 'asc' as const }]
  const replyOrderBy =
    sort === 'new'
      ? [{ createdAt: 'desc' as const }]
      : [{ score: 'desc' as const }, { createdAt: 'asc' as const }]

  // total top-level count (for pagination)
  const totalTopLevel = await db.comment.count({ where: { postId: id, parentId: null } })

  const comments = await db.comment.findMany({
    where: { postId: id, parentId: null },
    orderBy: rootOrderBy,
    take: limit,
    skip: offset,
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
      replies: {
        orderBy: replyOrderBy,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
          replies: {
            orderBy: replyOrderBy,
            include: {
              author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
              _count: { select: { replies: true } },
            },
          },
          _count: { select: { replies: true } },
        },
      },
      _count: { select: { replies: true } },
    },
  })

  const user = await getCurrentUser()
  let voteMap: Record<string, number> = {}
  const allIds: string[] = []
  const collect = (list: any[]) => {
    for (const c of list) {
      allIds.push(c.id)
      if (c.replies) collect(c.replies)
    }
  }
  collect(comments)
  if (user && allIds.length) {
    const votes = await db.vote.findMany({
      where: { userId: user.id, commentId: { in: allIds } },
      select: { commentId: true, value: true },
    })
    voteMap = Object.fromEntries(votes.map((v) => [v.commentId, v.value]))
  }

  const map = (c: any) => ({
    id: c.id,
    body: c.body,
    image: c.image,
    score: c.score,
    upvotes: c.upvotes,
    downvotes: c.downvotes,
    isAnswer: c.isAnswer,
    edited: c.edited ?? false,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    author: c.author,
    userVote: voteMap[c.id] || 0,
    replyCount: c._count?.replies ?? 0,
    replies: (c.replies || []).map(map),
  })

  return NextResponse.json({
    comments: comments.map(map),
    totalTopLevel,
    hasMore: offset + limit < totalTopLevel,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })

  const { body, image, parentId } = await req.json()
  if (!body || body.trim().length < 1) {
    return NextResponse.json({ error: 'Comentário vazio.' }, { status: 400 })
  }
  const post = await db.post.findUnique({
    where: { id },
    select: { id: true, authorId: true, community: { select: { name: true } } },
  })
  if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })

  let parentAuthorId: string | null = null
  if (parentId) {
    const parent = await db.comment.findUnique({ where: { id: parentId }, select: { authorId: true } })
    if (!parent) return NextResponse.json({ error: 'Comentário de origem não encontrado.' }, { status: 400 })
    parentAuthorId = parent.authorId
  }

  const comment = await db.comment.create({
    data: {
      body: body.trim().slice(0, 4000),
      image: image || null,
      postId: id,
      authorId: user.id,
      parentId: parentId || null,
    },
  })

  // increment post answer count for direct answers (parentId null) on question posts
  await db.post.update({ where: { id }, data: { answerCount: { increment: 1 } } })

  // notification (respects notifyOnReply pref)
  const targetUserId = parentId ? parentAuthorId : post.authorId
  if (targetUserId && targetUserId !== user.id) {
    const { maybeCreateNotification } = await import('@/lib/notification-prefs')
    await maybeCreateNotification({
      userId: targetUserId,
      pref: 'notifyOnReply',
      type: 'reply',
      title: parentId ? 'Alguém respondeu ao teu comentário' : 'Nova resposta à tua pergunta',
      body: body.trim().slice(0, 140),
      link: `post:${id}`,
    })
  }

  // award badges to the commenter (best-effort)
  const { awardBadges } = await import('@/lib/badges')
  await awardBadges(user.id)

  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      image: comment.image,
      score: 0,
      upvotes: 0,
      downvotes: 0,
      isAnswer: false,
      edited: false,
      createdAt: comment.createdAt,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        karma: user.karma,
      },
      userVote: 0,
      replyCount: 0,
      replies: [],
    },
  })
}
