import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const community = await db.community.findUnique({ where: { slug } })
  if (!community) return NextResponse.json({ error: 'Comunidade não encontrada.' }, { status: 404 })

  const user = await getCurrentUser()
  let joined = false
  let isModerator = false
  if (user) {
    const m = await db.membership.findUnique({
      where: { userId_communityId: { userId: user.id, communityId: community.id } },
    })
    joined = !!m
    isModerator = m?.role === 'moderator' || user.role === 'admin'
  }
  return NextResponse.json({ community, joined, isModerator })
}

// PATCH — edit community description + rules (moderators only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })
  const community = await db.community.findUnique({ where: { slug } })
  if (!community) return NextResponse.json({ error: 'Comunidade não encontrada.' }, { status: 404 })

  // only moderators (community creator/mod role) or admins
  const membership = await db.membership.findUnique({
    where: { userId_communityId: { userId: user.id, communityId: community.id } },
  })
  const isMod = membership?.role === 'moderator' || user.role === 'admin'
  if (!isMod) {
    return NextResponse.json({ error: 'Apenas moderadores podem editar a comunidade.' }, { status: 403 })
  }

  const body = await req.json()
  const { description, rules } = body || {}
  const data: any = {}
  if (typeof description === 'string') data.description = description.trim().slice(0, 300) || null
  if (typeof rules === 'string') data.rules = rules.slice(0, 2000) || null

  const updated = await db.community.update({ where: { id: community.id }, data })
  return NextResponse.json({ community: updated })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // join / leave toggle
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })
  const community = await db.community.findUnique({ where: { slug } })
  if (!community) return NextResponse.json({ error: 'Comunidade não encontrada.' }, { status: 404 })

  const existing = await db.membership.findUnique({
    where: { userId_communityId: { userId: user.id, communityId: community.id } },
  })
  if (existing) {
    await db.membership.delete({ where: { id: existing.id } })
    await db.community.update({
      where: { id: community.id },
      data: { members: { decrement: 1 } },
    })
    return NextResponse.json({ joined: false, members: Math.max(0, community.members - 1) })
  } else {
    await db.membership.create({
      data: { userId: user.id, communityId: community.id },
    })
    await db.community.update({
      where: { id: community.id },
      data: { members: { increment: 1 } },
    })
    return NextResponse.json({ joined: true, members: community.members + 1 })
  }
}
