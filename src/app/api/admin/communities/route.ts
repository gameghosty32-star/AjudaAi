import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/communities — list all communities
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  const where: any = {}
  if (q) {
    where.OR = [{ name: { contains: q } }, { slug: { contains: q } }]
  }

  const communities = await db.community.findMany({
    where,
    orderBy: [{ members: 'desc' }, { name: 'asc' }],
    select: {
      id: true, slug: true, name: true, description: true, icon: true, color: true,
      category: true, members: true, createdAt: true,
      _count: { select: { posts: true, memberships: true } },
    },
  })

  return NextResponse.json({
    communities: communities.map((c) => ({ ...c, postCount: c._count.posts, membershipCount: c._count.memberships, _count: undefined })),
  })
}

// DELETE /api/admin/communities — delete a community
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const communityId = searchParams.get('communityId')
    if (!communityId) return NextResponse.json({ error: 'communityId em falta.' }, { status: 400 })
    await db.community.delete({ where: { id: communityId } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }
}
