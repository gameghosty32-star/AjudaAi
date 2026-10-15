'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type PostSummary, type Comment as CommentType } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Avatar, CommunityIcon, KarmaBadge, PostTypeBadge, TagPill } from '@/components/atoms'
import { VoteButtons } from '@/components/vote-buttons'
import { SaveButton } from '@/components/save-button'
import { CommentTree } from '@/components/comment-tree'
import { EditPostDialog } from '@/components/edit-post-dialog'
import { MarkdownContent } from '@/components/markdown'
import { ImageUpload } from '@/components/image-upload'
import { RelatedPosts } from '@/components/related-posts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo, formatNumber } from '@/lib/format'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, MessageSquare, Eye, Share2, ArrowLeft, ExternalLink, Send, Trash2, AlertCircle, Pencil, Flame, Clock, X } from 'lucide-react'

export function PostDetail({ id }: { id: string }) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const qc = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentImage, setCommentImage] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [commentSort, setCommentSort] = useState<'top' | 'new'>('top')

  // Listen for post-edited event to refetch
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail === id) {
        qc.invalidateQueries({ queryKey: ['post', id] })
      }
    }
    window.addEventListener('post-edited', handler)
    return () => window.removeEventListener('post-edited', handler)
  }, [id, qc])

  const { data, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get<{ post: any }>(`/api/posts/${id}`),
  })

  const [commentOffset, setCommentOffset] = useState(0)
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['comments', id, commentSort, commentOffset],
    queryFn: () => api.get<{ comments: CommentType[]; totalTopLevel: number; hasMore: boolean }>(`/api/posts/${id}/comments?sort=${commentSort}&limit=20&offset=${commentOffset}`),
  })
  const comments = commentsData?.comments ?? []
  const hasMoreComments = commentsData?.hasMore ?? false
  const totalTopLevel = commentsData?.totalTopLevel ?? 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error || !data?.post) {
    return (
      <Card className="p-10 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Publicação não encontrada</h3>
        <p className="mt-1 text-sm text-muted-foreground">Pode ter sido removida ou o link está incorreto.</p>
        <Button className="mt-4" onClick={() => navigate({ name: 'home' })}>Voltar ao início</Button>
      </Card>
    )
  }

  const post = data.post
  const isQuestion = post.type === 'question'

  async function submitComment() {
    if (!user) return openAuth('login')
    if (!commentText.trim()) return
    setPosting(true)
    try {
      await api.post(`/api/posts/${id}/comments`, { body: commentText, image: commentImage, parentId: null })
      setCommentText('')
      setCommentImage(null)
      await refetchComments()
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Resposta publicada! 🎉')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPosting(false)
    }
  }

  async function deletePost() {
    if (!confirm('Tens a certeza que queres apagar esta publicação?')) return
    try {
      await api.delete(`/api/posts/${id}`)
      toast.success('Publicação removida.')
      navigate({ name: 'home' })
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(post.community ? { name: 'community', slug: post.community.slug } : { name: 'home' })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar a {post.community?.name || 'início'}
      </button>

      <Card className="overflow-hidden p-0">
        <div className="flex gap-0">
          <div className="flex flex-col items-stretch bg-secondary/40 p-3 sm:p-4">
            <VoteButtons
              initialVote={post.userVote}
              initialScore={post.score}
              kind="post"
              id={post.id}
            />
          </div>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <button
                onClick={() => post.community && navigate({ name: 'community', slug: post.community.slug })}
                className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
              >
                <CommunityIcon icon={post.community.icon} color={post.community.color} size="sm" className="h-5 w-5 rounded-md" />
                {post.community.name}
              </button>
              <span>·</span>
              <button
                onClick={() => navigate({ name: 'user', username: post.author.username })}
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

            <h1 className="text-balance text-xl font-bold leading-tight tracking-tight sm:text-2xl">
              {post.title}
            </h1>

            {post.body && (
              <MarkdownContent content={post.body} className="mt-3 text-[15px] leading-relaxed text-foreground/90" />
            )}

            {post.image && (
              <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
                <img src={post.image} alt={post.title} className="max-h-[600px] w-full object-contain" />
              </div>
            )}

            {post.type === 'link' && post.link && (
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />
                {post.link.replace(/^https?:\/\//, '').slice(0, 60)}
              </a>
            )}

            {post.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((t: string) => <TagPill key={t} name={t} />)}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {formatNumber(comments.length)} {isQuestion ? 'respostas' : 'comentários'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {formatNumber(post.views)} visualizações
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/?post=${post.id}`)
                  toast.success('Link copiado!')
                }}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Share2 className="h-4 w-4" /> Partilhar
              </button>
              <SaveButton postId={post.id} initialSaved={post.saved} />
              {user?.id === post.author.id && (
                <>
                  <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button onClick={deletePost} className="inline-flex items-center gap-1.5 text-destructive hover:underline">
                    <Trash2 className="h-4 w-4" /> Apagar
                  </button>
                </>
              )}
              {post.edited && (
                <span className="text-[11px] italic text-muted-foreground/60">(editado)</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Answer box */}
      <Card className="p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-primary" />
          {isQuestion ? 'A tua resposta' : 'O teu comentário'}
        </h3>
        {user ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Avatar name={user.displayName} color={user.avatarColor} size="sm" />
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 4000))}
                placeholder={isQuestion ? 'Escreve a tua resposta. Sê claro, útil e respeitoso…' : 'Partilha a tua opinião…'}
                rows={3}
                className="resize-y"
              />
            </div>
            <div className="ml-11">
              {commentImage ? (
                <div className="relative overflow-hidden rounded-lg border bg-muted">
                  <img src={commentImage} alt="Pré-visualização" className="max-h-48 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCommentImage(null)}
                    className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
                    aria-label="Remover imagem"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <ImageUpload value={commentImage} onChange={setCommentImage} compact />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{commentText.length}/4000</span>
              <Button size="sm" disabled={posting || !commentText.trim()} onClick={submitComment} className="gap-1.5">
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isQuestion ? 'Responder' : 'Comentar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
            <p className="text-sm text-muted-foreground">Inicia sessão para {isQuestion ? 'responder' : 'comentar'}.</p>
            <Button size="sm" onClick={() => openAuth('login')}>Entrar</Button>
          </div>
        )}
      </Card>

      {/* Comments */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {formatNumber(totalTopLevel)} {isQuestion ? 'respostas' : 'comentários'}
          </h3>
          <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
            {(['top', 'new'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setCommentSort(s); setCommentOffset(0) }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  commentSort === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s === 'top' ? <><Flame className="h-3 w-3" /> Top</> : <><Clock className="h-3 w-3" /> Novas</>}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          {comments.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              {isQuestion ? 'Ainda não há respostas. Sê o primeiro a ajudar!' : 'Ainda não há comentários. Começa a conversa!'}
            </Card>
          ) : (
            comments.map((c) => (
              <CommentTree
                key={c.id}
                comment={c}
                postId={post.id}
                postAuthorId={post.author.id}
                isQuestion={isQuestion}
              />
            ))
          )}
        </div>

        {/* Load more comments */}
        {hasMoreComments && (
          <div className="flex justify-center py-3">
            <Button variant="outline" size="sm" onClick={() => setCommentOffset((o) => o + 20)} className="gap-1.5">
              <Loader2 className="h-3.5 w-3.5" />
              Carregar mais respostas ({totalTopLevel - comments.length} restantes)
            </Button>
          </div>
        )}
      </div>

      {/* Related posts */}
      <RelatedPosts postId={post.id} />

      {user?.id === post.author.id && (
        <EditPostDialog
          postId={post.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={{ title: post.title, body: post.body, link: post.link, image: post.image, type: post.type }}
        />
      )}
    </div>
  )
}
