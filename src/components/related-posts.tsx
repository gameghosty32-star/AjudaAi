'use client'

import { useQuery } from '@tanstack/react-query'
import { api, type PostSummary } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { CommunityIcon } from '@/components/atoms'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, timeAgo } from '@/lib/format'
import { Link2, MessageSquare, Flame } from 'lucide-react'

export function RelatedPosts({ postId }: { postId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['related-posts', postId],
    queryFn: () => api.get<{ posts: PostSummary[] }>(`/api/posts/${postId}/related`),
  })
  const posts = data?.posts ?? []
  if (!isLoading && posts.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <Link2 className="h-4 w-4 text-primary" /> Publicações relacionadas
      </h3>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <Card
              key={p.id}
              onClick={() => navigate({ name: 'post', id: p.id })}
              className="group cursor-pointer p-3 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                    {p.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CommunityIcon icon={p.community.icon} color={p.community.color} size="sm" className="h-3.5 w-3.5 rounded" />
                      {p.community.name}
                    </span>
                    <span>·</span>
                    <span>{timeAgo(p.createdAt)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5"><Flame className="h-3 w-3" /> {formatNumber(p.score)}</span>
                    <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {formatNumber(p.commentCount)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
