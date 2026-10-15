'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useApp, navigate } from '@/lib/store'
import { api, type PostSummary } from '@/lib/api'
import { PostCard } from '@/components/post-card'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Hash, ArrowLeft, Inbox } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function TagView({ tag }: { tag: string }) {
  const sort = useApp((s) => s.sort)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const query = useInfiniteQuery({
    queryKey: ['tag-posts', tag, sort],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ sort, limit: '15' })
      if (pageParam) params.set('cursor', pageParam as string)
      return api.get<{ posts: PostSummary[]; nextCursor: string | null; tag: { name: string } | null }>(`/api/tags/${encodeURIComponent(tag)}?${params}`)
    },
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
      <button
        onClick={() => navigate({ name: 'home' })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-rose-500/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-600 text-white shadow-sm">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">#{tag}</h1>
            <p className="text-sm text-muted-foreground">
              {query.isLoading ? 'A carregar…' : `${posts.length} publicações com esta etiqueta`}
            </p>
          </div>
        </div>
      </div>

      {query.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {isEmpty && (
        <Card className="p-10 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Sem publicações com #{tag}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Sê o primeiro a usar esta etiqueta!</p>
        </Card>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-10" />
      {query.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
