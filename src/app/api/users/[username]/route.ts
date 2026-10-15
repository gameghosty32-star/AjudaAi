import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const u = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarColor: true,
      location: true,
      karma: true,
      role: true,
      createdAt: true,
      badges: { include: { badge: true } },
      _count: {
        select: {
          posts: true,
          comments: true,
          following: true,
          followers: true,
          memberships: true,
        },
      },
    },
  })
  if (!u) return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })

  const me = await getCurrentUser()
  const isMe = me?.id === u.id
  let isFollowing = false
  if (me && !isMe) {
    const f = await db.follow.findUnique({
      where: { followerId_followeeId: { followerId: me.id, followeeId: u.id } },
    })
    isFollowing = !!f
  }

  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') || 'posts'

  let posts: any[] = []
  let comments: any[] = []
  if (tab === 'posts') {
    posts = await db.post.findMany({
      where: { authorId: u.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        community: { select: { slug: true, name: true, color: true, icon: true } },
        _count: { select: { comments: true } },
      },
    })
  } else if (tab === 'comments') {
    comments = await db.comment.findMany({
      where: { authorId: u.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        post: { select: { id: true, title: true, community: { select: { slug: true, name: true } } } },
      },
    })
  }

  return NextResponse.json({
    user: {
      ...u,
      isMe,
      isFollowing,
      followingCount: u._count.following,
      followersCount: u._count.followers,
      communityCount: u._count.memberships,
    },
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      score: p.score,
      commentCount: p._count.comments,
      createdAt: p.createdAt,
      community: p.community,
    })),
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      score: c.score,
      isAnswer: c.isAnswer,
      createdAt: c.createdAt,
      post: c.post,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const body = await req.json()
  const { displayName, bio, location, avatarColor } = body || {}
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(typeof displayName === 'string' ? { displayName: displayName.trim().slice(0, 40) } : {}),
      ...(typeof bio === 'string' ? { bio: bio.trim().slice(0, 280) } : {}),
      ...(typeof location === 'string' ? { location: location.trim() || null } : {}),
      ...(avatarColor ? { avatarColor } : {}),
    },
    select: {
      id: true, username: true, displayName: true, bio: true, avatarColor: true,
      location: true, karma: true, role: true, email: true,
    },
  })
  return NextResponse.json({ user: updated })
}
