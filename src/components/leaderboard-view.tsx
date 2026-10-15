'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Avatar, KarmaBadge } from '@/components/atoms'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { avatarGradient } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Trophy, Flame, FileText, MessageSquare, Award, MapPin, Crown, Medal } from 'lucide-react'

type LeaderUser = {
  id: string
  username: string
  displayName: string | null
  avatarColor: string
  location: string | null
  karma: number
  rank: number
  posts: number
  comments: number
  badges: number
  createdAt: string
}

export function LeaderboardView() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get<{ users: LeaderUser[] }>('/api/leaderboard'),
  })
  const users = data?.users ?? []
  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-emerald-500/10 p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Trophy className="h-7 w-7 text-amber-500" />
          Top angolanos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os maiores contribuidores da comunidade AjudaAí. Ganha karma a perguntar, responder e ajudar.
        </p>
      </div>

      {/* Podium */}
      {top3.length === 3 && !isLoading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* 2nd */}
          <PodiumCard user={top3[1]} place={2} className="mt-6" />
          {/* 1st */}
          <PodiumCard user={top3[0]} place={1} />
          {/* 3rd */}
          <PodiumCard user={top3[2]} place={3} className="mt-10" />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      )}

      {/* Full ranking */}
      {!isLoading && rest.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">Classificação completa</h2>
          {rest.map((u) => (
            <Card
              key={u.id}
              onClick={() => navigate({ name: 'user', username: u.username })}
              className="flex cursor-pointer items-center gap-3 p-3 transition-all hover:shadow-md"
            >
              <div className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">
                {u.rank}
              </div>
              <Avatar name={u.displayName} color={u.avatarColor} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{u.displayName || u.username}</span>
                  {u.badges > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                      <Award className="h-3 w-3" /> {u.badges}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>u/{u.username}</span>
                  {u.location && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {u.location}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1" title="Publicações"><FileText className="h-3 w-3" /> {u.posts}</span>
                <span className="inline-flex items-center gap-1" title="Respostas"><MessageSquare className="h-3 w-3" /> {u.comments}</span>
                <KarmaBadge karma={u.karma} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Ainda não há utilizadores para classificar.
        </Card>
      )}
    </div>
  )
}

function PodiumCard({ user, place, className }: { user: LeaderUser; place: 1 | 2 | 3; className?: string }) {
  const medalColor =
    place === 1 ? 'from-amber-400 to-yellow-600' :
    place === 2 ? 'from-slate-300 to-slate-500' :
    'from-orange-400 to-orange-700'
  const Icon = place === 1 ? Crown : Medal
  const size = place === 1 ? 'xl' : 'lg'
  return (
    <Card
      onClick={() => navigate({ name: 'user', username: user.username })}
      className={cn('flex cursor-pointer flex-col items-center gap-2 p-3 text-center transition-all hover:shadow-lg sm:p-4', className)}
    >
      <div className={cn('flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white', medalColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <Avatar name={user.displayName} color={user.avatarColor} size={size} className={cn(place === 1 && 'ring-4 ring-amber-300/50 dark:ring-amber-500/30')} />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{user.displayName || user.username}</div>
        <div className="truncate text-[11px] text-muted-foreground">u/{user.username}</div>
      </div>
      <div className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
        place === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-secondary text-foreground')}>
        <Flame className="h-3 w-3" /> {user.karma}
      </div>
    </Card>
  )
}
