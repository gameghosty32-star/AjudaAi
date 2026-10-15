import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json()
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Indique o utilizador/email e a palavra-passe.' }, { status: 400 })
    }
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: identifier.toLowerCase() },
          { email: identifier.toLowerCase() },
        ],
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }
    const token = await createSession(user.id)
    await setSessionCookie(token)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarColor: user.avatarColor,
        karma: user.karma,
        role: user.role,
        location: user.location,
      },
    })
  } catch (e) {
    console.error('[login] error', e)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
