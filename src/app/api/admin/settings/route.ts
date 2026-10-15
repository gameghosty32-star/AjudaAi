import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

// Default platform settings
export const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: 'AjudaAí',
  siteTagline: 'A plataforma de ajuda de Angola',
  siteDescription: 'Faz perguntas, partilha conhecimento e ajuda outros angolanos. Comunidades por província e tópico.',
  allowRegistration: 'true',
  allowPosting: 'true',
  allowComments: 'true',
  requireEmailVerification: 'false',
  maxPostBodyLength: '8000',
  maxCommentBodyLength: '4000',
  globalRules: 'Sê respeitoso com todos os membros.\nPartilha apenas informação verdadeira e verificável.\nNão faças spam nem auto-promoção excessiva.\nUsa português de Angola (pt-AO).\nDenúncia conteúdo ofensivo aos moderadores.',
  maintenanceMode: 'false',
  welcomeMessage: 'Bem-vindo ao AjudaAí! 🇦🇴 Explora as comunidades das tuas províncias e tópicos favoritos, faz perguntas e ajuda outros angolanos.',
}

// GET /api/admin/settings — get all platform settings (public read for siteName/tagline, admin for all)
export async function GET(req: NextRequest) {
  const isAdmin = await requireAdmin().then(() => true).catch(() => false)

  const settings = await db.setting.findMany()
  const map: Record<string, string> = { ...DEFAULT_SETTINGS }
  settings.forEach((s) => { map[s.key] = s.value })

  // non-admins only get public settings
  if (!isAdmin) {
    return NextResponse.json({
      settings: {
        siteName: map.siteName,
        siteTagline: map.siteTagline,
        siteDescription: map.siteDescription,
        welcomeMessage: map.welcomeMessage,
      },
    })
  }

  return NextResponse.json({ settings: map })
}

// PUT /api/admin/settings — update platform settings (admin only)
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e: any) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: e.message === 'FORBIDDEN' ? 403 : 401 })
  }

  const body = await req.json()
  const updates: Record<string, string> = {}

  // only allow known keys
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key in body) {
      updates[key] = String(body[key])
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  const all = await db.setting.findMany()
  const map: Record<string, string> = { ...DEFAULT_SETTINGS }
  all.forEach((s) => { map[s.key] = s.value })

  return NextResponse.json({ settings: map, updated: Object.keys(updates) })
}
