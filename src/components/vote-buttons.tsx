'use client'

import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function VoteButtons({
  initialVote,
  initialScore,
  kind,
  id,
  orientation = 'vertical',
  size = 'md',
}: {
  initialVote: number
  initialScore: number
  kind: 'post' | 'comment'
  id: string
  orientation?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md'
}) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const [vote, setVote] = useState(initialVote)
  const [score, setScore] = useState(initialScore)
  const [loading, setLoading] = useState(false)
  const [pop, setPop] = useState(false)

  async function voteHandler(value: 1 | -1) {
    if (!user) {
      openAuth('login')
      toast.info('Inicia sessão para votar.')
      return
    }
    if (loading) return
    const next = vote === value ? 0 : value
    setLoading(true)
    const prevVote = vote
    const prevScore = score
    setVote(next)
    setScore((s) => s + (next - prevVote))
    setPop(true)
    setTimeout(() => setPop(false), 250)
    try {
      const url = kind === 'post' ? `/api/posts/${id}/vote` : `/api/comments/${id}/vote`
      const res = await api.post<{ userVote: number; score: number }>(url, { value: next })
      setVote(res.userVote)
      setScore(res.score)
    } catch (e: any) {
      setVote(prevVote)
      setScore(prevScore)
      toast.error(e.message || 'Erro ao votar')
    } finally {
      setLoading(false)
    }
  }

  const btn = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const scoreText = size === 'sm' ? 'text-xs' : 'text-sm'

  if (orientation === 'horizontal') {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-secondary/70">
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); voteHandler(1) }}
          disabled={loading}
          aria-label="Votar a favor"
          className={cn(
            'inline-flex items-center justify-center rounded-full transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/40',
            btn,
            vote === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          )}
        >
          <ArrowBigUp className={cn(icon, 'fill-current', pop && 'vote-pop')} />
        </button>
        <span className={cn('min-w-6 text-center font-semibold tabular-nums', scoreText, vote !== 0 && (vote === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'))}>
          {score}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); voteHandler(-1) }}
          disabled={loading}
          aria-label="Votar contra"
          className={cn(
            'inline-flex items-center justify-center rounded-full transition-colors hover:bg-rose-100 dark:hover:bg-rose-950/40',
            btn,
            vote === -1 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
          )}
        >
          <ArrowBigDown className={cn(icon, 'fill-current')} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-secondary/60 py-1">
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); voteHandler(1) }}
        disabled={loading}
        aria-label="Votar a favor"
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/40',
          btn,
          vote === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-emerald-600'
        )}
      >
        <ArrowBigUp className={cn(icon, 'fill-current', pop && 'vote-pop')} />
      </button>
      <span className={cn('min-w-6 text-center font-bold tabular-nums', scoreText, vote !== 0 && (vote === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'))}>
        {score}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); voteHandler(-1) }}
        disabled={loading}
        aria-label="Votar contra"
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors hover:bg-rose-100 dark:hover:bg-rose-950/40',
          btn,
          vote === -1 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground hover:text-rose-600'
        )}
      >
        <ArrowBigDown className={cn(icon, 'fill-current')} />
      </button>
    </div>
  )
}
