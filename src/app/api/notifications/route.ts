import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ notifications: [], unread: 0 })
  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === '1'

  const notifications = await db.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const unread = await db.notification.count({ where: { userId: user.id, read: false } })
  return NextResponse.json({ notifications, unread })
}
