'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Avatar, KarmaBadge } from '@/components/atoms'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Trophy, Crown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type LeaderUser = {
  id: string
  username: string
  displayName: string | null
  avatarColor: string
  karma: number
  rank: number
}

export function LeaderboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', 'widget'],
    queryFn: () => api.get<{ users: LeaderUser[] }>('/api/leaderboard'),
    staleTime: 60_000,
  })
  const users = (data?.users ?? []).slice(0, 5)

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-white">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Trophy className="h-4 w-4" /> Top contribuidores
        </h3>
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
          </div>
        ) : (
          <ol className="space-y-1">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => navigate({ name: 'user', username: u.username })}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    u.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                    u.rank === 2 ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                    u.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' :
                    'bg-secondary text-muted-foreground'
                  )}>
                    {u.rank === 1 ? <Crown className="h-3 w-3" /> : u.rank}
                  </span>
                  <Avatar name={u.displayName} color={u.avatarColor} size="xs" className="h-6 w-6 text-[9px]" />
                  <span className="min-w-0 flex-1 truncate font-medium">{u.displayName || u.username}</span>
                  <KarmaBadge karma={u.karma} />
                </button>
              </li>
            ))}
          </ol>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-between text-xs"
          onClick={() => navigate({ name: 'leaderboard' })}
        >
          Ver classificação completa <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  )
}

