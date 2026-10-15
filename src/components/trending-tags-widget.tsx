'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Hash, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TrendingTagsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['tags', 'trending'],
    queryFn: () => api.get<{ tags: { name: string; count: number }[] }>('/api/tags/trending'),
    staleTime: 120_000,
  })
  const tags = data?.tags ?? []
  if (!isLoading && tags.length === 0) return null

  const colors = ['rose', 'amber', 'emerald', 'orange', 'fuchsia', 'cyan', 'violet', 'blue']
  const colorClasses: Record<string, string> = {
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <TrendingUp className="h-4 w-4 text-primary" /> Etiquetas populares
      </h3>
      {isLoading ? (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <button
              key={t.name}
              onClick={() => navigate({ name: 'tag', tag: t.name })}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-transform hover:scale-105',
                colorClasses[colors[i % colors.length]]
              )}
            >
              <Hash className="h-3 w-3" />
              {t.name}
              <span className="ml-0.5 text-[10px] opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
