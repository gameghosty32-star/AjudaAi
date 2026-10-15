import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users/me/preferences
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ preferences: {} })
  const u = await db.user.findUnique({ where: { id: user.id }, select: { preferences: true } })
  let prefs: any = {}
  try { prefs = u?.preferences ? JSON.parse(u.preferences) : {} } catch {}
  return NextResponse.json({ preferences: prefs })
}

// PUT /api/users/me/preferences — merge and save
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const body = await req.json()
  const existing = await db.user.findUnique({ where: { id: user.id }, select: { preferences: true } })
  let current: any = {}
  try { current = existing?.preferences ? JSON.parse(existing.preferences) : {} } catch {}
  const merged = { ...current, ...body }
  await db.user.update({ where: { id: user.id }, data: { preferences: JSON.stringify(merged) } })
  return NextResponse.json({ preferences: merged })
}
