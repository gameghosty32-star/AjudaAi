'use client'

import { useState } from 'react'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function FollowButton({
  username,
  initialFollowing = false,
}: {
  username: string
  initialFollowing?: boolean
}) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!user) return openAuth('login')
    if (loading) return
    setLoading(true)
    const prev = following
    setFollowing(!prev)
    try {
      const res = await api.post<{ following: boolean }>(`/api/users/${username}/follow`)
      setFollowing(res.following)
      toast.success(res.following ? `Começaste a seguir @${username}!` : `Deixaste de seguir @${username}.`)
    } catch (e: any) {
      setFollowing(prev)
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (following) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
          'group'
        )}
        aria-label="Deixar de seguir"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
        <span className="group-hover:hidden">A seguir</span>
        <span className="hidden group-hover:inline">Deixar de seguir</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
      Seguir
    </button>
  )
}
