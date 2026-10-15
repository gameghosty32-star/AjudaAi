'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Community } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { CommunityIcon } from '@/components/atoms'
import { colorOf } from '@/lib/theme'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, Users, MessageCircle, Plus, Hash, MapPin, Sparkles } from 'lucide-react'

export function CommunitiesView() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'Província' | 'Tópico'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['communities', 'explore', q, filter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (filter !== 'all') params.set('category', filter)
      return api.get<{ communities: Community[] }>(`/api/communities?${params}`)
    },
  })
  const communities = data?.communities ?? []

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-emerald-500/10 p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" />
          Explorar comunidades
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descobre comunidades por província ou por tópico. Junta-te, pergunta e partilha conhecimento com angolanos.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar comunidade…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'Província', 'Tópico'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'
              )}
            >
              {f === 'all' && <Sparkles className="h-3.5 w-3.5" />}
              {f === 'Província' && <MapPin className="h-3.5 w-3.5" />}
              {f === 'Tópico' && <Hash className="h-3.5 w-3.5" />}
              {f === 'all' ? 'Todas' : f === 'Província' ? 'Províncias' : 'Tópicos'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((c) => <CommunityCard key={c.id} community={c} />)}
        </div>
      )}

      {!isLoading && communities.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhuma comunidade encontrada para "{q}".
        </Card>
      )}
    </div>
  )
}

function CommunityCard({ community }: { community: Community }) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const qc = useQueryClient()
  const [joined, setJoined] = useState(!!community.joined)
  const c = colorOf(community.color)

  async function toggleJoin() {
    if (!user) return openAuth('login')
    try {
      const res = await api.post<{ joined: boolean }>(`/api/communities/${community.slug}`)
      setJoined(res.joined)
      qc.invalidateQueries({ queryKey: ['communities'] })
      toast.success(res.joined ? `Juntaste-te a ${community.name}!` : `Saíste de ${community.name}.`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <Card className="group flex flex-col gap-3 p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <CommunityIcon icon={community.icon} color={community.color} size="lg" />
        <div className="min-w-0 flex-1">
          <button onClick={() => navigate({ name: 'community', slug: community.slug })} className="text-left">
            <h3 className="font-semibold leading-tight hover:underline">{community.name}</h3>
          </button>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5', c.bgSoft, c.text)}>
              {community.category}
            </span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {community.members.toLocaleString('pt-AO')}</span>
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{community.description}</p>
      <div className="mt-auto flex items-center gap-2">
        <Button
          size="sm"
          variant={joined ? 'secondary' : 'default'}
          onClick={toggleJoin}
          className="flex-1 gap-1.5"
        >
          {joined ? '✓ Membro' : <><Plus className="h-3.5 w-3.5" /> Entrar</>}
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate({ name: 'community', slug: community.slug })} className="gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> Ver
        </Button>
      </div>
    </Card>
  )
}
