'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function ImageUpload({
  value,
  onChange,
  compact = false,
}: {
  value: string | null
  onChange: (url: string | null) => void
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas ficheiros de imagem.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Imagem demasiado grande (máx. 4MB).')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no upload')
      onChange(data.url)
      toast.success('Imagem carregada! 📷')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <img src={value} alt="Pré-visualização" className="max-h-64 w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
          aria-label="Remover imagem"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-secondary/60',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
        {uploading ? 'A carregar…' : 'Imagem'}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={cn(
        'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 py-6 text-center transition-colors hover:border-foreground/30 hover:bg-secondary/60',
        uploading && 'pointer-events-none opacity-70'
      )}
    >
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <ImagePlus className="h-6 w-6 text-muted-foreground" />
      )}
      <div className="text-sm">
        <span className="font-medium text-foreground">{uploading ? 'A carregar…' : 'Adicionar imagem'}</span>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF · máx. 4MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </button>
  )
}
