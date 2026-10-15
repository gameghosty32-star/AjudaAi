'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useApp, navigate } from '@/lib/store'
import { api, type PostSummary } from '@/lib/api'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Loader2, Inbox, Flame, Sparkles, TrendingUp, Clock, PenSquare, Users, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

const SORTS = [
  { key: 'hot', label: 'Em alta', icon: Flame },
  { key: 'new', label: 'Novas', icon: Clock },
  { key: 'top', label: 'Top', icon: TrendingUp },
  { key: 'rising', label: 'A subir', icon: Sparkles },
] as const

export function Feed({ communitySlug, type }: { communitySlug?: string; type?: string }) {
  const sort = useApp((s) => s.sort)
  const setSort = useApp((s) => s.setSort)
  const user = useApp((s) => s.user)
  const openComposer = useApp((s) => s.openComposer)
  const openAuth = useApp((s) => s.openAuth)
  const [source, setSource] = useState<'all' | 'following'>('all')
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Apply user's defaultSort preference on first load (only on home feed, not community)
  useEffect(() => {
    if (communitySlug || !user) return
    api.get<{ preferences: any }>('/api/users/me/preferences').then((r) => {
      const pref = r.preferences?.defaultSort
      if (pref && ['hot', 'new', 'top'].includes(pref)) {
        setSort(pref)
      }
    }).catch(() => {})
  }, [user, communitySlug, setSort])

  const query = useInfiniteQuery({
    queryKey: ['posts', source, communitySlug || 'all', type || 'all', sort],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ sort, limit: '15' })
      if (communitySlug) params.set('community', communitySlug)
      if (type) params.set('type', type)
      if (pageParam) params.set('cursor', pageParam as string)
      const base = source === 'following' ? '/api/posts/following' : '/api/posts'
      return api.get<{ posts: PostSummary[]; nextCursor: string | null; empty?: boolean }>(`${base}?${params}`)
    },
    enabled: source !== 'following' || !!user,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor || undefined,
  })

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage()
        }
      },
      { rootMargin: '400px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [query])

  const posts = query.data?.pages.flatMap((p) => p.posts) ?? []
  const isEmpty = !query.isLoading && posts.length === 0

  return (
    <div className="space-y-3">
      {/* Source toggle: All / Following (only on home feed, not in community) */}
      {!communitySlug && user && (
        <div className="flex items-center gap-1 rounded-xl bg-secondary/60 p-0.5">
          <button
            onClick={() => setSource('all')}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-all',
              source === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className="h-3.5 w-3.5" /> Toda a comunidade
          </button>
          <button
            onClick={() => setSource('following')}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-all',
              source === 'following' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-3.5 w-3.5" /> A seguir
          </button>
        </div>
      )}

      {/* Sort tabs */}
      <div className="sticky top-[57px] z-20 -mx-1 flex items-center gap-1 rounded-xl bg-background/80 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-1 overflow-x-auto scroll-thin">
          {SORTS.map((s) => {
            const Icon = s.icon
            const active = sort === s.key
            return (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            )
          })}
        </div>
        <div className="ml-auto hidden sm:block">
          <Button
            size="sm"
            onClick={() => (user ? openComposer(communitySlug) : useApp.getState().openAuth('login'))}
            className="gap-1.5"
          >
            <PenSquare className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex gap-3">
                <div className="h-16 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
          {source === 'following' ? (
            <>
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Ainda não segues ninguém</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Segue outros angolanos para veres as suas publicações aqui. Explora o leaderboard ou as comunidades para encontrares pessoas interessantes!
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate({ name: 'leaderboard' })}>
                  Ver top angolanos
                </Button>
                <Button size="sm" onClick={() => setSource('all')}>
                  Ver toda a comunidade
                </Button>
              </div>
            </>
          ) : (
            <>
              <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">Ainda não há publicações aqui</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Sê o primeiro a partilhar uma pergunta ou discussão. A comunidade angolana agradece!
              </p>
              {user ? (
                <Button className="mt-4 gap-1.5" onClick={() => openComposer(communitySlug)}>
                  <PenSquare className="h-4 w-4" /> Criar publicação
                </Button>
              ) : (
                <Button className="mt-4" onClick={() => useApp.getState().openAuth('register')}>
                  Junta-te ao AjudaAí
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      {/* Load more sentinel (infinite scroll) */}
      <div ref={sentinelRef} className="h-10" />
      {query.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Load more button fallback (always visible if more pages, even before scroll triggers) */}
      {query.hasNextPage && !query.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" size="sm" onClick={() => query.fetchNextPage()} className="gap-1.5">
            <Loader2 className="h-3.5 w-3.5" /> Carregar mais
          </Button>
        </div>
      )}

      {query.hasNextPage === false && posts.length > 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Chegaste ao fim. Obrigado por fazeres parte da comunidade 🇦🇴
          </span>
        </div>
      )}
    </div>
  )
}
