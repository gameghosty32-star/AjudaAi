'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Users, FileText, MessageSquare, ThumbsUp, TrendingUp, HelpCircle, MessageCircle, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityPoint = { date: string; posts: number; comments: number }

export function CommunityAnalytics({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['community-analytics', slug],
    queryFn: () => api.get<any>(`/api/communities/${slug}/analytics`),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="mt-4 h-32" />
      </Card>
    )
  }

  if (!data) return null
  const stats = data.stats
  const series: ActivityPoint[] = data.activitySeries || []
  const maxVal = Math.max(1, ...series.map((s) => Math.max(s.posts, s.comments)))

  const statCards = [
    { label: 'Publicações', value: stats.totalPosts, icon: FileText, color: 'rose' },
    { label: 'Respostas', value: stats.totalComments, icon: MessageSquare, color: 'emerald' },
    { label: 'Votos', value: stats.totalVotes, icon: ThumbsUp, color: 'amber' },
    { label: 'Membros', value: stats.membershipCount, icon: Users, color: 'cyan' },
  ]

  const colorMap: Record<string, string> = {
    rose: 'from-rose-500 to-rose-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    cyan: 'from-cyan-500 to-cyan-700',
  }

  const typeBreakdown = data.typeBreakdown
  const typeTotal = typeBreakdown.question + typeBreakdown.discussion + typeBreakdown.link || 1

  return (
    <Card className="p-5">
      <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
        <BarChart3 className="h-4 w-4 text-primary" /> Estatísticas da comunidade
      </h3>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border bg-card p-3">
              <div className={cn('mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white', colorMap[s.color])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold tabular-nums">{s.value.toLocaleString('pt-AO')}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Activity chart (last 30 days) */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Atividade (30 dias)</span>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Publicações</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Respostas</span>
          </div>
        </div>
        <div className="flex h-24 items-end gap-px overflow-x-auto scroll-thin">
          {series.map((s) => (
            <div key={s.date} className="group relative flex min-w-[6px] flex-1 flex-col justify-end gap-px" title={`${s.date}: ${s.posts} posts, ${s.comments} respostas`}>
              <div
                className="w-full rounded-t-sm bg-rose-400 transition-all group-hover:bg-rose-500 dark:bg-rose-600"
                style={{ height: `${(s.posts / maxVal) * 60}px` }}
              />
              <div
                className="w-full rounded-b-sm bg-emerald-400 transition-all group-hover:bg-emerald-500 dark:bg-emerald-600"
                style={{ height: `${(s.comments / maxVal) * 60}px` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="mt-4 space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Tipos de publicação</span>
        {[
          { label: 'Perguntas', count: typeBreakdown.question, icon: HelpCircle, color: 'bg-rose-500' },
          { label: 'Discussões', count: typeBreakdown.discussion, icon: MessageCircle, color: 'bg-emerald-500' },
          { label: 'Links', count: typeBreakdown.link, icon: LinkIcon, color: 'bg-cyan-500' },
        ].map((t) => {
          const Icon = t.icon
          const pct = Math.round((t.count / typeTotal) * 100)
          return (
            <div key={t.label} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="w-20 text-xs">{t.label}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className={cn('absolute inset-y-0 left-0 rounded-full', t.color)} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{t.count} ({pct}%)</span>
            </div>
          )
        })}
      </div>

      {/* Extra stats */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Score médio: <span className="font-semibold text-foreground">{stats.avgScore}</span></span>
        <span>👍 {stats.totalUpvotes}</span>
        <span>👎 {stats.totalDownvotes}</span>
        <span>Criada em {new Date(data.createdAt).toLocaleDateString('pt-AO', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      </div>
    </Card>
  )
}
