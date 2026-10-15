'use client'

import { Card } from '@/components/ui/card'
import { Avatar, CommunityIcon, KarmaBadge, PostTypeBadge, TagPill } from '@/components/atoms'
import { VoteButtons } from '@/components/vote-buttons'
import { SaveButton } from '@/components/save-button'
import type { PostSummary } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { timeAgo, formatNumber, excerpt } from '@/lib/format'
import { MessageSquare, Eye, Share2, CheckCircle2, ExternalLink, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function PostCard({ post, compact = false }: { post: PostSummary; compact?: boolean }) {
  const route = useApp((s) => s.route)
  const isOnCommunity = route.name === 'community' && route.slug === post.community.slug

  return (
    <Card
      role="article"
      onClick={() => navigate({ name: 'post', id: post.id })}
      className={cn(
        'group relative cursor-pointer overflow-hidden p-0 transition-all hover:border-foreground/20 hover:shadow-md',
        post.type === 'question' && post.answerCount > 0 && 'ring-1 ring-emerald-500/20 dark:ring-emerald-400/15'
      )}
    >
      {/* Answered accent stripe */}
      {post.type === 'question' && post.answerCount > 0 && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" aria-hidden />
      )}
      <div className="flex gap-0">
        {/* Vote rail */}
        <div className="flex flex-col items-stretch p-2 sm:p-3">
          <VoteButtons
            initialVote={post.userVote}
            initialScore={post.score}
            kind="post"
            id={post.id}
            size={compact ? 'sm' : 'md'}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 py-2.5 pr-3 sm:py-3 sm:pr-4">
          {/* Meta */}
          <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {!isOnCommunity && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ name: 'community', slug: post.community.slug })
                }}
                className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
              >
                <CommunityIcon icon={post.community.icon} color={post.community.color} size="sm" className="h-4 w-4 rounded-md" />
                {post.community.name}
              </button>
            )}
            <span className="text-muted-foreground/60">·</span>
            <span>por</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate({ name: 'user', username: post.author.username }) }}
              className="inline-flex items-center gap-1 font-medium hover:underline"
            >
              <Avatar name={post.author.displayName} color={post.author.avatarColor} size="xs" className="h-4 w-4 text-[8px]" />
              u/{post.author.username}
            </button>
            {typeof post.author.karma === 'number' && <KarmaBadge karma={post.author.karma} />}
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <PostTypeBadge type={post.type} />
          </div>

          {/* Title */}
          <h2 className="text-balance text-base font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary sm:text-lg">
            {post.title}
          </h2>

          {/* Body excerpt */}
          {post.body && !compact && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{excerpt(post.body, 240)}</p>
          )}

          {/* Image thumbnail */}
          {post.image && !compact && (
            <div className="mt-2 overflow-hidden rounded-lg border bg-muted">
              <img
                src={post.image}
                alt=""
                loading="lazy"
                className="max-h-52 w-full object-cover transition-transform group-hover:scale-[1.01]"
              />
            </div>
          )}

          {/* Link preview */}
          {post.type === 'link' && post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {post.link.replace(/^https?:\/\//, '').slice(0, 60)}
            </a>
          )}

          {/* Footer actions */}
          <div className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={(e) => { e.stopPropagation(); navigate({ name: 'post', id: post.id }) }}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors hover:bg-secondary hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {formatNumber(post.commentCount)} {post.type === 'question' ? 'respostas' : 'coment.'}
            </button>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {formatNumber(post.views)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (post.type === 'question' && post.answerCount > 0) {
                  toast.success('Esta pergunta já tem respostas ✅')
                }
              }}
              className="hidden items-center gap-1.5 rounded-full px-2 py-1 font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 sm:inline-flex"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {post.answerCount > 0 ? `${post.answerCount} respostas` : 'Sem respostas'}
            </button>
            <SaveButton postId={post.id} initialSaved={post.saved} />
            <button
              onClick={(e) => {
                e.stopPropagation()
                const url = `${window.location.origin}/?post=${post.id}`
                navigator.clipboard?.writeText(url)
                toast.success('Link copiado!')
              }}
              className="hidden items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            >
              <Share2 className="h-3.5 w-3.5" />
              Partilhar
            </button>
          </div>
        </div>
        <ChevronRight className="mr-3 mt-3 hidden h-5 w-5 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 sm:block" />
      </div>
    </Card>
  )
}
