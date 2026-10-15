import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/leaderboard — top users by karma
export async function GET(_req: NextRequest) {
  const users = await db.user.findMany({
    orderBy: { karma: 'desc' },
    take: 50,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarColor: true,
      location: true,
      karma: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true, badges: true } },
    },
  })
  return NextResponse.json({
    users: users.map((u, i) => ({
      ...u,
      rank: i + 1,
      posts: u._count.posts,
      comments: u._count.comments,
      badges: u._count.badges,
      _count: undefined,
    })),
  })
}
