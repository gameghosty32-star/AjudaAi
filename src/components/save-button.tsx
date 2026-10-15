'use client'

import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function SaveButton({
  postId,
  initialSaved = false,
  variant = 'ghost',
}: {
  postId: string
  initialSaved?: boolean
  variant?: 'ghost' | 'solid'
}) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!user) {
      openAuth('login')
      toast.info('Inicia sessão para guardar publicações.')
      return
    }
    if (loading) return
    setLoading(true)
    const prev = saved
    setSaved(!prev)
    try {
      const res = await api.post<{ saved: boolean }>(`/api/posts/${postId}/save`)
      setSaved(res.saved)
      toast.success(res.saved ? 'Publicação guardada! 🔖' : 'Publicação removida dos guardados.')
    } catch (e: any) {
      setSaved(prev)
      toast.error(e.message || 'Erro ao guardar')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'solid') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? 'Remover dos guardados' : 'Guardar publicação'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors',
          saved
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <Bookmark className={cn('h-3.5 w-3.5', saved && 'fill-current')} />
        {saved ? 'Guardado' : 'Guardar'}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remover dos guardados' : 'Guardar publicação'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors',
        saved
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      <Bookmark className={cn('h-3.5 w-3.5', saved && 'fill-current')} />
      <span className="hidden sm:inline">{saved ? 'Guardado' : 'Guardar'}</span>
    </button>
  )
}
