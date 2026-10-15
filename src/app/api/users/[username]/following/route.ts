import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[username]/following — list users this user follows
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const u = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } })
  if (!u) return NextResponse.json({ users: [] })

  const follows = await db.follow.findMany({
    where: { followerId: u.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      followee: {
        select: {
          id: true, username: true, displayName: true, avatarColor: true,
          location: true, karma: true, bio: true,
        },
      },
    },
  })

  return NextResponse.json({
    users: follows.map((f) => f.followee),
  })
}
