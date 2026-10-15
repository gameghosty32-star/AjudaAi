import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[username]/activity — daily activity for last 90 days (heatmap)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const u = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, createdAt: true } })
  if (!u) return NextResponse.json({ activity: [] })

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)

  const [posts, comments, votes] = await Promise.all([
    db.post.findMany({
      where: { authorId: u.id, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.comment.findMany({
      where: { authorId: u.id, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.vote.findMany({
      where: { userId: u.id, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ])

  // aggregate by date (YYYY-MM-DD)
  const map: Record<string, number> = {}
  const add = (d: Date) => {
    const key = d.toISOString().slice(0, 10)
    map[key] = (map[key] || 0) + 1
  }
  posts.forEach((p) => add(p.createdAt))
  comments.forEach((c) => add(c.createdAt))
  votes.forEach((v) => add(v.createdAt))

  const activity = Object.entries(map).map(([date, count]) => ({ date, count }))
  const total = activity.reduce((sum, a) => sum + a.count, 0)

  return NextResponse.json({ activity, total, days: activity.length })
}
