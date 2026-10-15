'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'

type ActivityItem = { date: string; count: number }

function getIntensity(count: number): number {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

const INTENSITY_CLASSES = [
  'bg-secondary/60',
  'bg-rose-200 dark:bg-rose-950/40',
  'bg-rose-400 dark:bg-rose-800/60',
  'bg-rose-500 dark:bg-rose-700/80',
  'bg-rose-600 dark:bg-rose-600',
]

export function ActivityHeatmap({ username }: { username: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', username],
    queryFn: () => api.get<{ activity: ActivityItem[]; total: number; days: number }>(`/api/users/${username}/activity`),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid grid-cols-[repeat(18,1fr)] gap-1">
          {Array.from({ length: 90 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-sm" />)}
        </div>
      </Card>
    )
  }

  const activity = data?.activity ?? []
  const total = data?.total ?? 0
  if (total === 0) return null

  // build a 90-day grid (oldest first), with day-of-week alignment
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = activity.find((a) => a.date === key)
    days.push({ date: key, count: found?.count || 0 })
  }

  // pad start to align with day of week (Sunday = 0)
  const firstDay = new Date(days[0].date).getDay()
  const padded: ({ date: string; count: number } | null)[] = Array(firstDay).fill(null).concat(days)

  // group into weeks (7 columns)
  const weeks: (typeof padded)[] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthLabels: { label: string | null; weekIdx: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstReal = week.find((d) => d !== null) as { date: string } | null | undefined
    if (firstReal) {
      const m = new Date(firstReal.date).getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ label: months[m], weekIdx: wi })
        lastMonth = m
      }
    }
  })

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Atividade recente
        </h3>
        <span className="text-xs text-muted-foreground">
          {total} contribuições em {data?.days ?? 0} dias
        </span>
      </div>
      <div className="overflow-x-auto scroll-thin">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="mb-1 flex" style={{ gap: '3px' }}>
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.weekIdx === wi)?.label
              return (
                <div key={wi} className="w-3 text-[9px] text-muted-foreground" style={{ minWidth: '12px' }}>
                  {label || ''}
                </div>
              )
            })}
          </div>
          {/* Grid: weeks as columns, days as rows */}
          <div className="flex" style={{ gap: '3px' }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: '3px' }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={cn('h-3 w-3 rounded-sm', day === null ? 'bg-transparent' : INTENSITY_CLASSES[getIntensity(day.count)])}
                    title={day ? `${day.date}: ${day.count} contribuição${day.count !== 1 ? 'ões' : ''}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Menos</span>
            {INTENSITY_CLASSES.map((c, i) => (
              <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />
            ))}
            <span>Mais</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
