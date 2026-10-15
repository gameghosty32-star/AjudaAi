import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/communities/[slug]/moderators — list community moderators
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const community = await db.community.findUnique({ where: { slug }, select: { id: true } })
  if (!community) return NextResponse.json({ moderators: [] })

  const memberships = await db.membership.findMany({
    where: { communityId: community.id, role: 'moderator' },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarColor: true, karma: true, location: true, bio: true },
      },
    },
  })

  return NextResponse.json({
    moderators: memberships.map((m) => ({
      ...m.user,
      joinedAt: m.createdAt,
    })),
  })
}
