'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Notification } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/format'
import { toast } from 'sonner'
import { Bell, BellOff, CheckCheck, Reply, ThumbsUp, Star, Sparkles, MessageSquare, Heart, Trophy, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, any> = {
  welcome: Sparkles,
  reply: Reply,
  vote: ThumbsUp,
  answer: Star,
  post: MessageSquare,
  mention: Heart,
  badge: Trophy,
  follow: UserPlus,
}

const COLORS: Record<string, string> = {
  welcome: 'from-amber-500 to-orange-600',
  reply: 'from-emerald-500 to-teal-700',
  vote: 'from-rose-500 to-rose-700',
  answer: 'from-amber-500 to-yellow-600',
  post: 'from-cyan-500 to-blue-600',
  mention: 'from-fuchsia-500 to-pink-700',
  badge: 'from-violet-500 to-purple-700',
  follow: 'from-emerald-500 to-emerald-700',
}

export function NotificationsView() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: Notification[]; unread: number }>('/api/notifications'),
    enabled: !!user,
  })

  const notifications = data?.notifications ?? []

  async function markAllRead() {
    try {
      await api.post('/api/notifications/read-all')
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificações marcadas como lidas.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function handleClick(n: Notification) {
    if (n.link) {
      const [type, id] = n.link.split(':')
      if (type === 'post') navigate({ name: 'post', id })
      else if (type === 'community') navigate({ name: 'community', slug: id })
      else if (type === 'user') {
        // id is the username to view (or 'me' → current user)
        const username = (id === 'me' || !id) ? user?.username : id
        if (username) navigate({ name: 'user', username })
      }
      else if (type === 'leaderboard') navigate({ name: 'leaderboard' })
      else if (type === 'comment') navigate({ name: 'home' })
    }
  }

  if (!user) {
    return (
      <Card className="p-10 text-center">
        <BellOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Inicia sessão para ver notificações</h3>
        <Button className="mt-4" onClick={() => openAuth('login')}>Entrar</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Bell className="h-6 w-6 text-primary" />
          Notificações
          {data?.unread ? (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{data.unread}</span>
          ) : null}
        </h1>
        {data?.unread ? (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" /> Marcar tudo como lido
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <BellOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Sem notificações</h3>
          <p className="mt-1 text-sm text-muted-foreground">Quando alguém responder ou votar nas tuas publicações, aparece aqui.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell
            const color = COLORS[n.type] || 'from-rose-500 to-rose-700'
            return (
              <Card
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'flex cursor-pointer items-start gap-3 p-4 transition-all hover:shadow-md',
                  !n.read && 'border-l-4 border-l-primary'
                )}
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
