import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tags/trending — top tags by post count in the last 30 days
export async function GET(_req: NextRequest) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  const tags = await db.tag.findMany({
    select: {
      name: true,
      _count: { select: { posts: { where: { post: { createdAt: { gte: since } } } } } },
    },
  })
  const filtered = tags
    .map((t) => ({ name: t.name, count: t._count.posts }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
  return NextResponse.json({ tags: filtered })
}
