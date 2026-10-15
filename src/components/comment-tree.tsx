'use client'

import { useState } from 'react'
import type { Comment } from '@/lib/api'
import { Avatar, KarmaBadge, AnswerBadge } from '@/components/atoms'
import { VoteButtons } from '@/components/vote-buttons'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useApp, navigate } from '@/lib/store'
import { api } from '@/lib/api'
import { timeAgo, excerpt } from '@/lib/format'
import { toast } from 'sonner'
import { MessageSquare, Reply, Star, CheckCircle2, Loader2, ChevronDown, ChevronUp, Pencil, Trash2, X, Check } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { cn } from '@/lib/utils'

export function CommentTree({
  comment,
  postId,
  postAuthorId,
  depth = 0,
  isQuestion,
}: {
  comment: Comment
  postId: string
  postAuthorId: string
  depth?: number
  isQuestion: boolean
}) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || [])
  const [markingAnswer, setMarkingAnswer] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.body)
  const [editImage, setEditImage] = useState<string | null>(comment.image || null)
  const [editLoading, setEditLoading] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [bodyText, setBodyText] = useState(comment.body)
  const [imageText, setImageText] = useState<string | null>(comment.image || null)
  const [isEdited, setIsEdited] = useState(comment.edited)
  const [isAnswer, setIsAnswer] = useState(comment.isAnswer)

  async function submitReply() {
    if (!user) return openAuth('login')
    if (!replyText.trim()) return
    setLoading(true)
    try {
      const res = await api.post<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
        body: replyText, parentId: comment.id,
      })
      setLocalReplies([...localReplies, res.comment])
      setReplyText('')
      setReplying(false)
      toast.success('Resposta publicada!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function markAnswer() {
    if (!user) return openAuth('login')
    setMarkingAnswer(true)
    try {
      const res = await api.post<{ isAnswer: boolean }>(`/api/comments/${comment.id}/answer`)
      setIsAnswer(res.isAnswer)
      toast.success(res.isAnswer ? 'Resposta marcada como melhor! 🎉' : 'Marcador removido.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setMarkingAnswer(false)
    }
  }

  async function saveEdit() {
    if (!editText.trim()) return
    setEditLoading(true)
    try {
      await api.patch(`/api/comments/${comment.id}`, { body: editText, image: editImage })
      setBodyText(editText.trim())
      setImageText(editImage)
      setIsEdited(true)
      setEditing(false)
      toast.success('Comentário editado.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function deleteComment() {
    if (!confirm('Apagar este comentário? Esta ação não pode ser desfeita.')) return
    try {
      await api.delete(`/api/comments/${comment.id}`)
      setIsDeleted(true)
      toast.success('Comentário apagado.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex w-full items-center gap-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className="h-3 w-3" />
        <Avatar name={comment.author.displayName} color={comment.author.avatarColor} size="xs" className="h-4 w-4 text-[8px]" />
        <span className="font-medium">u/{comment.author.username}</span>
        <span>· {comment.score} pontos · {comment.replyCount + (localReplies.length - (comment.replies?.length || 0))} respostas</span>
      </button>
    )
  }

  return (
    <div className={cn('relative', depth > 0 && 'ml-3 border-l-2 border-border pl-3 sm:ml-5')}>
      <div className="flex gap-2.5 py-2">
        <button
          onClick={() => navigate({ name: 'user', username: comment.author.username })}
          className="shrink-0"
          aria-label={`Ver perfil de ${comment.author.username}`}
        >
          <Avatar name={comment.author.displayName} color={comment.author.avatarColor} size="sm" />
        </button>
        <div className="min-w-0 flex-1">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => navigate({ name: 'user', username: comment.author.username })}
              className="font-semibold text-foreground hover:underline"
            >
              {comment.author.displayName || comment.author.username}
            </button>
            <span className="text-muted-foreground">u/{comment.author.username}</span>
            {typeof comment.author.karma === 'number' && <KarmaBadge karma={comment.author.karma} />}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground" title={new Date(comment.createdAt).toLocaleString('pt-AO')}>
              {timeAgo(comment.createdAt)}
            </span>
            {isAnswer && <AnswerBadge />}
            {comment.author.id === postAuthorId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <CheckCircle2 className="h-2.5 w-2.5" /> OP
              </span>
            )}
          </div>

          {/* Body or edit mode */}
          {isDeleted ? (
            <div className="mt-1.5 text-sm italic text-muted-foreground">
              [comentário apagado]
            </div>
          ) : editing ? (
            <div className="mt-1.5 rounded-lg border bg-card p-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, 4000))}
                rows={3}
                className="resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                autoFocus
              />
              {editImage ? (
                <div className="relative mt-2 overflow-hidden rounded-lg border bg-muted">
                  <img src={editImage} alt="" className="max-h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEditImage(null)}
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
                    aria-label="Remover imagem"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <ImageUpload value={editImage} onChange={setEditImage} compact />
                </div>
              )}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{editText.length}/4000</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(bodyText); setEditImage(imageText) }} className="h-7 gap-1">
                    <X className="h-3 w-3" /> Cancelar
                  </Button>
                  <Button size="sm" disabled={editLoading || !editText.trim()} onClick={saveEdit} className="h-7 gap-1">
                    {editLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {bodyText}
                {isEdited && (
                  <span className="ml-1 text-[10px] italic text-muted-foreground/60">(editado)</span>
                )}
              </div>
              {imageText && (
                <div className="mt-2 overflow-hidden rounded-lg border bg-muted">
                  <img src={imageText} alt="" loading="lazy" className="max-h-80 w-full object-contain" />
                </div>
              )}
            </>
          )}

          {/* Actions */}
          {!isDeleted && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <VoteButtons
              initialVote={comment.userVote}
              initialScore={comment.score}
              kind="comment"
              id={comment.id}
              orientation="horizontal"
              size="sm"
            />
            <button
              onClick={() => setReplying(!replying)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Reply className="h-3.5 w-3.5" /> Responder
            </button>
            {depth > 0 && (
              <button
                onClick={() => setCollapsed(true)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                <ChevronUp className="h-3.5 w-3.5" /> Fechar
              </button>
            )}
            {/* Edit / delete for own comments */}
            {user?.id === comment.author.id && !editing && (
              <>
                <button
                  onClick={() => { setEditing(true); setEditText(bodyText); setEditImage(imageText) }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={deleteComment}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Apagar
                </button>
              </>
            )}
            {/* Mark as answer: only post author, only on questions, only top-level */}
            {isQuestion && user?.id === postAuthorId && depth === 0 && (
              <button
                onClick={markAnswer}
                disabled={markingAnswer}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors',
                  isAnswer
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/50'
                )}
              >
                {markingAnswer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                {isAnswer ? 'Melhor resposta' : 'Marcar como melhor'}
              </button>
            )}
          </div>
          )}

          {/* Reply box */}
          {replying && (
            <div className="mt-2 rounded-lg border bg-card p-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Responder a ${comment.author.displayName || comment.author.username}…`}
                rows={2}
                className="resize-none border-0 bg-transparent text-sm focus-visible:ring-0"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => { setReplying(false); setReplyText('') }}>Cancelar</Button>
                <Button size="sm" disabled={loading || !replyText.trim()} onClick={submitReply} className="gap-1.5">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  Responder
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {localReplies.length > 0 && (
            <div className="mt-1">
              {localReplies.map((r) => (
                <CommentTree
                  key={r.id}
                  comment={r}
                  postId={postId}
                  postAuthorId={postAuthorId}
                  depth={depth + 1}
                  isQuestion={isQuestion}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
