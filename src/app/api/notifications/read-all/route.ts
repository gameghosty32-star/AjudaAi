import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// mark all as read
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
