import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me/saved — list saved posts for current user
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ posts: [] })

  const saved = await db.savedPost.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
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

  return NextResponse.json({
    posts: saved.map((s) => ({
      id: s.post.id,
      type: s.post.type,
      title: s.post.title,
      body: s.post.body,
      score: s.post.score,
      commentCount: s.post._count.comments,
      createdAt: s.post.createdAt,
      author: s.post.author,
      community: s.post.community,
      savedAt: s.createdAt,
    })),
  })
}
