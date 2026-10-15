'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Avatar, KarmaBadge } from '@/components/atoms'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, ShieldCheck } from 'lucide-react'

type Moderator = {
  id: string
  username: string
  displayName: string | null
  avatarColor: string
  karma: number
  location: string | null
  bio: string | null
  joinedAt: string
}

export function ModeratorsList({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['moderators', slug],
    queryFn: () => api.get<{ moderators: Moderator[] }>(`/api/communities/${slug}/moderators`),
  })
  const moderators = data?.moderators ?? []

  if (!isLoading && moderators.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Shield className="h-4 w-4 text-primary" /> Moderadores
      </h3>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {moderators.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate({ name: 'user', username: m.username })}
              className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-secondary"
            >
              <Avatar name={m.displayName} color={m.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-medium">{m.displayName || m.username}</span>
                  <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-500" />
                </div>
                <div className="truncate text-[11px] text-muted-foreground">u/{m.username}</div>
              </div>
              {typeof m.karma === 'number' && <KarmaBadge karma={m.karma} />}
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
