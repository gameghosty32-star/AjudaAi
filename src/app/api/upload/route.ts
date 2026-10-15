import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'

const UPLOAD_DIR = path.join(process.cwd(), 'upload')
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 4 * 1024 * 1024 // 4MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Tem de iniciar sessão.' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum ficheiro enviado.' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de ficheiro não permitido. Use JPEG, PNG, WebP ou GIF.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 4MB).' }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${nanoid(20)}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    return NextResponse.json({ url: `/api/uploads/${filename}`, filename })
  } catch (e) {
    console.error('[upload] error', e)
    return NextResponse.json({ error: 'Erro ao guardar o ficheiro.' }, { status: 500 })
  }
}
