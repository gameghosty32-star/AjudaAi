import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/stats — global platform stats
export async function GET() {
  try {
    await requireAdmin()
  } catch (e: any) {
    return NextResponse.json({ error: e.message === 'FORBIDDEN' ? 'Acesso restrito a administradores.' : 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  const since7 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)

  const [
    totalUsers, totalCommunities, totalPosts, totalComments,
    totalVotes, totalBadges, newUsers30d, newUsers7d, newPosts7d, newComments7d,
  ] = await Promise.all([
    db.user.count(),
    db.community.count(),
    db.post.count(),
    db.comment.count(),
    db.vote.count(),
    db.userBadge.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.user.count({ where: { createdAt: { gte: since7 } } }),
    db.post.count({ where: { createdAt: { gte: since7 } } }),
    db.comment.count({ where: { createdAt: { gte: since7 } } }),
  ])

  // posts per day (last 14 days)
  const posts14d: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = await db.post.count({
      where: {
        createdAt: {
          gte: new Date(key + 'T00:00:00.000Z'),
          lt: new Date(new Date(key).getTime() + 86400000),
        },
      },
    })
    posts14d.push({ date: key, count })
  }

  // new users per day (last 14 days)
  const users14d: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(key + 'T00:00:00.000Z'),
          lt: new Date(new Date(key).getTime() + 86400000),
        },
      },
    })
    users14d.push({ date: key, count })
  }

  return NextResponse.json({
    totals: {
      users: totalUsers,
      communities: totalCommunities,
      posts: totalPosts,
      comments: totalComments,
      votes: totalVotes,
      badges: totalBadges,
    },
    recent: {
      newUsers30d,
      newUsers7d,
      newPosts7d,
      newComments7d,
    },
    posts14d,
    users14d,
  })
}
