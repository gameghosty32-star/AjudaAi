'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, type PostSummary, type Community } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { PostCard } from '@/components/post-card'
import { Avatar, CommunityIcon, KarmaBadge } from '@/components/atoms'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Inbox, Users, MessageSquare, Hash, SlidersHorizontal, X, HelpCircle, Link as LinkIcon, Flame, Clock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const TYPE_FILTERS = [
  { key: 'all', label: 'Todos', icon: MessageSquare },
  { key: 'question', label: 'Perguntas', icon: HelpCircle },
  { key: 'discussion', label: 'Discussões', icon: MessageSquare },
  { key: 'link', label: 'Links', icon: LinkIcon },
] as const

const SORT_OPTIONS = [
  { key: 'top', label: 'Top', icon: Flame },
  { key: 'new', label: 'Novas', icon: Clock },
] as const

export function SearchView({ q }: { q: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [communityFilter, setCommunityFilter] = useState<string>('all')
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const [showFilters, setShowFilters] = useState(false)

  // fetch all communities for the filter dropdown
  const { data: communitiesData } = useQuery({
    queryKey: ['communities', 'search-filter'],
    queryFn: () => api.get<{ communities: Community[] }>('/api/communities'),
    staleTime: 120_000,
  })
  const allCommunities = communitiesData?.communities ?? []

  // Posts use infinite scroll; communities & users stay flat (small result sets)
  const postsQuery = useInfiniteQuery({
    queryKey: ['search-posts', q, typeFilter, communityFilter, sort],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ q, limit: '15', sort })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (communityFilter !== 'all') params.set('community', communityFilter)
      if (pageParam) params.set('cursor', pageParam as string)
      return api.get<{ posts: PostSummary[]; communities: any[]; users: any[]; nextCursor: string | null }>(`/api/search?${params}`)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor || undefined,
  })

  // Communities & users come from the first page (only when no filters applied)
  const communities = (!typeFilter || typeFilter === 'all') && (!communityFilter || communityFilter === 'all')
    ? (postsQuery.data?.pages[0]?.communities ?? [])
    : []
  const users = (!typeFilter || typeFilter === 'all') && (!communityFilter || communityFilter === 'all')
    ? (postsQuery.data?.pages[0]?.users ?? [])
    : []
  const posts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? []
  const isLoading = postsQuery.isLoading

  const hasFilters = typeFilter !== 'all' || communityFilter !== 'all'

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
          postsQuery.fetchNextPage()
        }
      },
      { rootMargin: '400px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [postsQuery])

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-4">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Search className="h-5 w-5 text-primary" />
          Resultados para "{q}"
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? 'A procurar…' : `${posts.length} publicações${hasFilters ? ' (filtrado)' : ''}, ${communities.length} comunidades, ${users.length} utilizadores`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort toggle */}
        <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
          {SORT_OPTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.key}
                onClick={() => setSort(s.key as 'top' | 'new')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  sort === s.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3 w-3" /> {s.label}
              </button>
            )
          })}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 overflow-x-auto scroll-thin">
          {TYPE_FILTERS.map((t) => {
            const Icon = t.icon
            const active = typeFilter === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3 w-3" /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Community filter dropdown */}
        <select
          value={communityFilter}
          onChange={(e) => setCommunityFilter(e.target.value)}
          className="ml-auto h-8 rounded-full border bg-secondary px-3 text-xs font-medium text-foreground outline-none hover:bg-accent"
        >
          <option value="all">Todas as comunidades</option>
          {allCommunities.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setTypeFilter('all'); setCommunityFilter('all') }} className="h-8 gap-1 text-xs">
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          {/* Users */}
          {users.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Users className="h-4 w-4" /> Utilizadores
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((u) => (
                  <Card key={u.id} className="flex cursor-pointer items-center gap-3 p-3 transition-all hover:shadow-md"
                    onClick={() => navigate({ name: 'user', username: u.username })}>
                    <Avatar name={u.displayName} color={u.avatarColor} size="md" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{u.displayName || u.username}</div>
                      <div className="truncate text-xs text-muted-foreground">u/{u.username}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {typeof u.karma === 'number' && <KarmaBadge karma={u.karma} />}
                        {u.location && <span className="text-xs text-muted-foreground">📍 {u.location}</span>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Communities */}
          {communities.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Hash className="h-4 w-4" /> Comunidades
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {communities.map((c) => (
                  <Card key={c.id} className="flex cursor-pointer items-center gap-3 p-3 transition-all hover:shadow-md"
                    onClick={() => navigate({ name: 'community', slug: c.slug })}>
                    <CommunityIcon icon={c.icon} color={c.color} size="md" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.members.toLocaleString('pt-AO')} membros</div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <MessageSquare className="h-4 w-4" /> Publicações
            </h2>
            {posts.length === 0 ? (
              <Card className="p-8 text-center">
                <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhuma publicação encontrada.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
                <div ref={sentinelRef} className="h-4" />
                {postsQuery.isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )}
          </section>

          {!isLoading && posts.length === 0 && communities.length === 0 && users.length === 0 && (
            <Card className="p-10 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Sem resultados</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tenta outras palavras-chave.</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
