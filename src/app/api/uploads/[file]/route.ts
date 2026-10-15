import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'upload')

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  // sanitize: only allow basename, no traversal
  const safe = path.basename(file)
  if (!safe.match(/^[\w.-]+\.(jpg|jpeg|png|webp|gif)$/i)) {
    return new NextResponse('Not found', { status: 404 })
  }
  const filepath = path.join(UPLOAD_DIR, safe)
  if (!existsSync(filepath)) {
    return new NextResponse('Not found', { status: 404 })
  }
  const ext = safe.split('.').pop()!.toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  const buffer = await readFile(filepath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
