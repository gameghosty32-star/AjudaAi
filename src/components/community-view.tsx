'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Community } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { CommunityIcon } from '@/components/atoms'
import { colorOf } from '@/lib/theme'
import { Feed } from '@/components/feed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Users, Plus, Check, ArrowLeft, PenSquare, HelpCircle, MessageSquare, Link as LinkIcon, Flag, ChevronDown, Settings, Loader2, Save } from 'lucide-react'
import { ModeratorsList } from '@/components/moderators-list'
import { CommunityAnalytics } from '@/components/community-analytics'

export function CommunityView({ slug }: { slug: string }) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)
  const qc = useQueryClient()
  const [joined, setJoined] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ description: '', rules: '' })
  const [editLoading, setEditLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: () => api.get<{ community: Community; joined: boolean; isModerator: boolean }>(`/api/communities/${slug}`),
  })
  const community = data?.community

  // sync joined + moderator state
  if (data && data.joined !== joined && !joined) setJoined(data.joined)
  if (data && data.isModerator !== isModerator) setIsModerator(data.isModerator)

  async function toggleJoin() {
    if (!user) return openAuth('login')
    try {
      const res = await api.post<{ joined: boolean }>(`/api/communities/${slug}`)
      setJoined(res.joined)
      qc.invalidateQueries({ queryKey: ['communities'] })
      qc.invalidateQueries({ queryKey: ['community', slug] })
      toast.success(res.joined ? `Juntaste-te a ${community?.name}!` : `Saíste de ${community?.name}.`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function openEdit() {
    if (community) {
      setEditForm({ description: community.description || '', rules: community.rules || '' })
    }
    setEditOpen(true)
  }

  async function saveCommunityEdit() {
    setEditLoading(true)
    try {
      await api.patch(`/api/communities/${slug}`, editForm)
      qc.invalidateQueries({ queryKey: ['community', slug] })
      setEditOpen(false)
      toast.success('Comunidade atualizada! ✏️')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setEditLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!community) {
    return (
      <Card className="p-10 text-center">
        <h3 className="text-lg font-semibold">Comunidade não encontrada</h3>
        <Button className="mt-4" onClick={() => navigate({ name: 'communities' })}>Ver todas as comunidades</Button>
      </Card>
    )
  }

  const c = colorOf(community.color)

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate({ name: 'communities' })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Todas as comunidades
      </button>

      {/* Header banner */}
      <Card className={cn('overflow-hidden p-0')}>
        <div className={cn('h-20 bg-gradient-to-r', c.gradient)} />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <CommunityIcon icon={community.icon} color={community.color} size="xl" className="ring-4 ring-card" />
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{community.name}</h1>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', c.bgSoft, c.text)}>
                    {community.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">c/{community.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {community.members.toLocaleString('pt-AO')}
                </div>
                <div>membros</div>
              </div>
              <Button
                onClick={toggleJoin}
                variant={joined ? 'secondary' : 'default'}
                className="gap-1.5"
              >
                {joined ? <><Check className="h-4 w-4" /> Membro</> : <><Plus className="h-4 w-4" /> Entrar</>}
              </Button>
              {user && (
                <Button variant="outline" size="icon" onClick={() => openComposer(slug)} aria-label="Publicar aqui">
                  <PenSquare className="h-4 w-4" />
                </Button>
              )}
              {isModerator && (
                <Button variant="outline" size="icon" onClick={openEdit} aria-label="Editar comunidade">
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {community.description && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{community.description}</p>
          )}
        </div>
      </Card>

      {/* Type filter + rules */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTypeFilter(undefined)}
            className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              !typeFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent')}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Tudo
          </button>
          <button
            onClick={() => setTypeFilter('question')}
            className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              typeFilter === 'question' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent')}
          >
            <HelpCircle className="h-3.5 w-3.5" /> Perguntas
          </button>
          <button
            onClick={() => setTypeFilter('discussion')}
            className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              typeFilter === 'discussion' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent')}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Discussões
          </button>
          <button
            onClick={() => setTypeFilter('link')}
            className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              typeFilter === 'link' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent')}
          >
            <LinkIcon className="h-3.5 w-3.5" /> Links
          </button>
        </div>
        {community.rules && (
          <details className="group w-full sm:w-72">
            <summary className="flex cursor-pointer items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary">
              <Flag className="h-4 w-4 text-primary" /> Regras da comunidade
              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-1 rounded-lg border bg-card p-3 text-sm">
              <ol className="space-y-1.5">
                {community.rules.split('\n').filter(Boolean).map((rule, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground">
                    <span className="font-bold text-foreground">{i + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        )}
      </div>

      <Feed communitySlug={slug} type={typeFilter} />

      {/* Community analytics */}
      <CommunityAnalytics slug={slug} />

      {/* Moderators list */}
      <ModeratorsList slug={slug} />

      {/* Edit dialog for moderators */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setEditOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="flex items-center gap-2 font-semibold"><Settings className="h-4 w-4" /> Editar comunidade</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>✕</Button>
            </div>
            <div className="space-y-4 overflow-y-auto scroll-thin p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Descrição</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value.slice(0, 300) })}
                  rows={3}
                  className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Descreve o tema da comunidade…"
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{editForm.description.length}/300</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Regras <span className="text-muted-foreground">(uma por linha)</span></label>
                <textarea
                  value={editForm.rules}
                  onChange={(e) => setEditForm({ ...editForm, rules: e.target.value.slice(0, 2000) })}
                  rows={8}
                  className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={"Sê respeitoso com todos.\nPartilha informação verdadeira.\nSem spam."}
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{editForm.rules.length}/2000</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button size="sm" disabled={editLoading} onClick={saveCommunityEdit} className="gap-1.5">
                {editLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
