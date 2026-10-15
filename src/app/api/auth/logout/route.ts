import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { destroySession, clearSessionCookie, readTokenFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = readTokenFromRequest(req)
  if (token) {
    try { await destroySession(token) } catch {}
  }
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
