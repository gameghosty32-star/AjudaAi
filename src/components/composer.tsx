'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useApp, navigate } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Loader2, HelpCircle, MessageSquare, Link as LinkIcon, X, Hash, Send } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { Community } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ImageUpload } from '@/components/image-upload'
import { usePersistentState, clearPersistentState } from '@/lib/use-persistent-state'

const TYPES = [
  { key: 'question', label: 'Pergunta', desc: 'Preciso de ajuda', icon: HelpCircle, color: 'rose' },
  { key: 'discussion', label: 'Discussão', desc: 'Quero debater', icon: MessageSquare, color: 'emerald' },
  { key: 'link', label: 'Link', desc: 'Partilhar site', icon: LinkIcon, color: 'cyan' },
] as const

export function Composer() {
  const open = useApp((s) => s.composerOpen)
  const close = useApp((s) => s.closeComposer)
  const presetCommunity = useApp((s) => s.composerCommunity)
  // Draft auto-save: title/body/link/tags persist to localStorage so accidental close doesn't lose work
  const [type, setType] = useState<'question' | 'discussion' | 'link'>('question')
  const [communitySlug, setCommunitySlug] = useState<string>(presetCommunity || '')
  const [title, setTitle] = usePersistentState<string>('draft:title', '')
  const [body, setBody] = usePersistentState<string>('draft:body', '')
  const [link, setLink] = usePersistentState<string>('draft:link', '')
  const [image, setImage] = useState<string | null>(null)
  const [tags, setTags] = usePersistentState<string[]>('draft:tags', [])
  const [tagInput, setTagInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  // tag autocomplete
  const cleanTagInput = tagInput.trim().toLowerCase().replace(/[^a-z0-9áàâãéêíóôõúçñ-]+/g, '')
  const { data: tagSuggestionsData } = useQuery({
    queryKey: ['tag-suggestions', cleanTagInput],
    queryFn: () => api.get<{ tags: { name: string; count: number }[] }>(`/api/tags/search?q=${encodeURIComponent(cleanTagInput)}`),
    enabled: cleanTagInput.length >= 1,
    staleTime: 10_000,
  })
  const tagSuggestions = (tagSuggestionsData?.tags ?? []).filter((s) => !tags.includes(s.name)).slice(0, 6)

  // On open: check if a draft exists. If draft content exists, restore it (don't clear).
  // Only clear the type/community defaults on first open with no draft.
  useEffect(() => {
    if (open) {
      setCommunitySlug(presetCommunity || '')
      const hasDraft = title.trim() || body.trim() || link.trim() || tags.length > 0
      if (hasDraft && !draftRestored) {
        setDraftRestored(true)
        // toast is shown in render to inform user
      } else if (!hasDraft) {
        setType('question')
      }
      setTagInput('')
    }
  }, [open, presetCommunity, title, body, link, tags, draftRestored])

  const { data } = useQuery({
    queryKey: ['communities', 'composer'],
    queryFn: () => api.get<{ communities: Community[] }>('/api/communities'),
    enabled: open,
  })
  const communities = data?.communities ?? []

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9áàâãéêíóôõúçñ-]+/g, '')
    if (!t) return
    if (tags.includes(t)) return setTagInput('')
    if (tags.length >= 5) return toast.warning('Máximo 5 etiquetas.')
    setTags([...tags, t])
    setTagInput('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!communitySlug) return toast.warning('Escolhe uma comunidade.')
    if (title.trim().length < 5) return toast.warning('Título muito curto.')
    if (type === 'link' && !link.trim()) return toast.warning('Indica um link.')
    setLoading(true)
    try {
      const res = await api.post<{ id: string }>('/api/posts', {
        communitySlug, type, title: title.trim(), body: body.trim() || undefined,
        link: type === 'link' ? link.trim() : undefined,
        image: type !== 'link' ? image : undefined,
        tags,
      })
      toast.success('Publicação criada! 🎉')
      // clear the draft from localStorage
      clearPersistentState('draft:title')
      clearPersistentState('draft:body')
      clearPersistentState('draft:link')
      clearPersistentState('draft:tags')
      setTitle('')
      setBody('')
      setLink('')
      setTags([])
      setImage(null)
      setDraftRestored(false)
      close()
      navigate({ name: 'post', id: res.id })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl gap-0 p-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">✍️</span> Criar publicação
          </DialogTitle>
          <DialogDescription>Partilha uma pergunta, discussão ou link com a comunidade angolana.</DialogDescription>
        </DialogHeader>

        {/* Draft restore notice */}
        {draftRestored && (title.trim() || body.trim() || tags.length > 0) && (
          <div className="flex items-center gap-2 border-b bg-amber-50 px-6 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            <span>💾</span>
            <span>Rascunho restaurado automaticamente.</span>
            <button
              type="button"
              onClick={() => {
                clearPersistentState('draft:title')
                clearPersistentState('draft:body')
                clearPersistentState('draft:link')
                clearPersistentState('draft:tags')
                setTitle('')
                setBody('')
                setLink('')
                setTags([])
                setDraftRestored(false)
              }}
              className="ml-auto font-medium underline hover:no-underline"
            >
              Descartar
            </button>
          </div>
        )}

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto scroll-thin px-6 py-4">
          {/* Type */}
          <div>
            <Label className="mb-2 block">Tipo de publicação</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon
                const active = type === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all',
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-foreground/30 hover:bg-secondary'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-semibold">{t.label}</span>
                    <span className="text-[11px] text-muted-foreground">{t.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Community */}
          <div>
            <Label className="mb-1.5 block">Comunidade *</Label>
            <div className="flex flex-wrap gap-1.5">
              {communities.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCommunitySlug(c.slug)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                    communitySlug === c.slug ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {communitySlug && (
              <p className="mt-1 text-xs text-muted-foreground">
                → A publicar em <span className="font-semibold">{communities.find((c) => c.slug === communitySlug)?.name}</span>
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="mb-1.5 block">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder={type === 'question' ? 'Ex: Como renovar o BI em Luanda?' : 'Ex: O trânsito da Marginal está insuportável'}
              maxLength={200}
              required
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{title.length}/200</p>
          </div>

          {/* Body */}
          {type !== 'link' && (
            <div>
              <Label htmlFor="body" className="mb-1.5 block">
                {type === 'question' ? 'Descreve a tua pergunta' : 'Conteúdo da discussão'}
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 8000))}
                placeholder="Dá contexto, partilha o que já tentaste, sê claro e respeitoso…"
                rows={6}
                className="resize-y"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{body.length}/8000</p>
            </div>
          )}

          {/* Image upload (not for link posts) */}
          {type !== 'link' && (
            <div>
              <Label className="mb-1.5 block">Imagem (opcional)</Label>
              <ImageUpload value={image} onChange={setImage} />
            </div>
          )}

          {/* Link */}
          {type === 'link' && (
            <div>
              <Label htmlFor="link" className="mb-1.5 block">URL *</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://exemplo.ao/artigo"
                required
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <Label className="mb-1.5 block">Etiquetas (máx. 5)</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                  <Hash className="h-3 w-3" />{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative mt-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag()
                  } else if (e.key === 'ArrowDown' && tagSuggestions.length > 0) {
                    e.preventDefault()
                    setSuggestionIndex((i) => Math.min(i + 1, tagSuggestions.length - 1))
                  } else if (e.key === 'ArrowUp' && tagSuggestions.length > 0) {
                    e.preventDefault()
                    setSuggestionIndex((i) => Math.max(i - 1, -1))
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Escreve e prime Enter (ex: luanda, emprego)"
              />
              {showSuggestions && tagSuggestions.length > 0 && tagInput.trim().length > 0 && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                  {tagSuggestions.map((s, i) => (
                    <button
                      key={s.name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (!tags.includes(s.name) && tags.length < 5) {
                          setTags([...tags, s.name])
                        }
                        setTagInput('')
                        setSuggestionIndex(-1)
                      }}
                      onMouseEnter={() => setSuggestionIndex(i)}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                        i === suggestionIndex ? 'bg-accent' : 'hover:bg-accent/50'
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                      </span>
                      {s.count > 0 && (
                        <span className="text-xs text-muted-foreground">{s.count} publicações</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
          <Button type="button" disabled={loading} onClick={submit} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
