import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/communities/[slug]/analytics — community stats and activity over time
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const community = await db.community.findUnique({ where: { slug }, select: { id: true, name: true, createdAt: true, members: true } })
  if (!community) return NextResponse.json({ error: 'Comunidade não encontrada.' }, { status: 404 })

  // last 30 days for activity
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)

  const [posts, comments, votes, memberships] = await Promise.all([
    db.post.findMany({
      where: { communityId: community.id },
      select: { id: true, createdAt: true, score: true, type: true, upvotes: true, downvotes: true },
    }),
    db.comment.findMany({
      where: { post: { communityId: community.id } },
      select: { id: true, createdAt: true },
    }),
    db.vote.findMany({
      where: { post: { communityId: community.id } },
      select: { id: true, createdAt: true, value: true },
    }),
    db.membership.findMany({
      where: { communityId: community.id },
      select: { id: true, createdAt: true },
    }),
  ])

  // posts per day (last 30 days)
  const postsByDay: Record<string, number> = {}
  const commentsByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    postsByDay[key] = 0
    commentsByDay[key] = 0
  }
  posts.forEach((p) => {
    const key = p.createdAt.toISOString().slice(0, 10)
    if (key in postsByDay) postsByDay[key]++
  })
  comments.forEach((c) => {
    const key = c.createdAt.toISOString().slice(0, 10)
    if (key in commentsByDay) commentsByDay[key]++
  })

  const activitySeries = Object.keys(postsByDay).map((date) => ({
    date,
    posts: postsByDay[date],
    comments: commentsByDay[date],
  }))

  // post type breakdown
  const typeBreakdown = {
    question: posts.filter((p) => p.type === 'question').length,
    discussion: posts.filter((p) => p.type === 'discussion').length,
    link: posts.filter((p) => p.type === 'link').length,
  }

  const totalUpvotes = posts.reduce((s, p) => s + p.upvotes, 0)
  const totalDownvotes = posts.reduce((s, p) => s + p.downvotes, 0)
  const avgScore = posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.score, 0) / posts.length) : 0

  return NextResponse.json({
    name: community.name,
    members: community.members,
    createdAt: community.createdAt,
    stats: {
      totalPosts: posts.length,
      totalComments: comments.length,
      totalVotes: votes.length,
      totalUpvotes,
      totalDownvotes,
      avgScore,
      membershipCount: memberships.length,
    },
    typeBreakdown,
    activitySeries,
  })
}
