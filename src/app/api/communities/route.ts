import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()
  const where: Record<string, unknown> = {}
  if (category) where.category = category
  if (q) where.name = { contains: q }

  const communities = await db.community.findMany({
    where,
    orderBy: [{ members: 'desc' }, { name: 'asc' }],
    take: 200,
  })

  let memberships: string[] = []
  const user = await getCurrentUser()
  if (user) {
    const m = await db.membership.findMany({
      where: { userId: user.id },
      select: { communityId: true },
    })
    memberships = m.map((x) => x.communityId)
  }

  return NextResponse.json({
    communities: communities.map((c) => ({
      ...c,
      joined: memberships.includes(c.id),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })
  try {
    const body = await req.json()
    const { name, description, category, icon, color } = body || {}
    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Nome da comunidade muito curto.' }, { status: 400 })
    }
    const slug = slugify(name)
    const exists = await db.community.findUnique({ where: { slug } })
    if (exists) return NextResponse.json({ error: 'Já existe uma comunidade com esse nome.' }, { status: 409 })

    const community = await db.community.create({
      data: {
        slug,
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'Geral',
        icon: icon || 'message-circle',
        color: color || 'rose',
        members: 1,
      },
    })
    await db.membership.create({
      data: { userId: user.id, communityId: community.id, role: 'moderator' },
    })
    return NextResponse.json({ community })
  } catch (e) {
    console.error('[community create] error', e)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}
