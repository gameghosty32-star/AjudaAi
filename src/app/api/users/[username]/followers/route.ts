import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[username]/followers — list users who follow this user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const u = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } })
  if (!u) return NextResponse.json({ users: [] })

  const follows = await db.follow.findMany({
    where: { followeeId: u.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      follower: {
        select: {
          id: true, username: true, displayName: true, avatarColor: true,
          location: true, karma: true, bio: true,
        },
      },
    },
  })

  return NextResponse.json({
    users: follows.map((f) => f.follower),
  })
}
