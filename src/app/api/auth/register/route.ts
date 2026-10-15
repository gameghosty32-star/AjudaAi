import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, email, password, displayName, location } = body || {}

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
    }
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json({ error: 'Nome de utilizador: 3-20 caracteres, letras, números ou _.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const exists = await db.user.findFirst({
      where: { OR: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] },
    })
    if (exists) {
      return NextResponse.json({ error: 'Nome de utilizador ou email já registado.' }, { status: 409 })
    }

    const colors = ['rose', 'amber', 'emerald', 'orange', 'fuchsia', 'cyan', 'red', 'lime']
    const user = await db.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        displayName: displayName?.trim() || username,
        location: location || null,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
      },
    })

    const token = await createSession(user.id)
    await setSessionCookie(token)

    await db.notification.create({
      data: {
        userId: user.id,
        type: 'welcome',
        title: 'Bem-vindo ao AjudaAí! 🇦🇴',
        body: 'Olá! Explora as comunidades das tuas províncias e tópicos favoritos, faz perguntas e ajuda outros angolanos.',
        link: 'community:geral',
      },
    })

    const badge = await db.badge.upsert({
      where: { key: 'novato' },
      update: {},
      create: {
        key: 'novato',
        name: 'Novato',
        description: 'Criou a sua conta no AjudaAí',
        icon: 'sparkles',
        color: 'amber',
      },
    })
    await db.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
      update: {},
      create: { userId: user.id, badgeId: badge.id },
    })

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
    console.error('[register] error', e)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
