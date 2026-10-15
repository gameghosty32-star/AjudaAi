import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tags/search?q=prefix — autocomplete tag suggestions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  if (q.length < 1) return NextResponse.json({ tags: [] })

  const tags = await db.tag.findMany({
    where: { name: { startsWith: q } },
    take: 8,
    orderBy: { posts: { _count: 'desc' } as any },
    select: { name: true, _count: { select: { posts: true } } },
  })

  return NextResponse.json({
    tags: tags.map((t) => ({ name: t.name, count: t._count.posts })),
  })
}
