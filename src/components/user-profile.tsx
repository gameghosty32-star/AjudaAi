'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Avatar, KarmaBadge, CommunityIcon } from '@/components/atoms'
import { avatarGradient, colorOf } from '@/lib/theme'
import { FollowButton } from '@/components/follow-button'
import { ActivityHeatmap } from '@/components/activity-heatmap'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { timeAgo, formatNumber, excerpt } from '@/lib/format'
import { MapPin, Calendar, Pencil, Award, MessageSquare, FileText, ArrowLeft, Save, X, Flame, Bookmark as BookmarkIcon, UserPlus, Users } from 'lucide-react'

const PROVINCES = [
  'Luanda', 'Benguela', 'Huíla', 'Huambo', 'Cabinda', 'Namibe', 'Malanje',
  'Uíge', 'Bié', 'Moxico', 'Cuando-Cubango', 'Cunene', 'Bengo', 'Kwanza-Norte',
  'Kwanza-Sul', 'Zaire', 'Lunda-Norte', 'Lunda-Sul', 'Diáspora',
]
const AVATAR_COLORS = ['rose', 'amber', 'emerald', 'orange', 'fuchsia', 'cyan', 'red', 'lime', 'violet', 'blue', 'green', 'yellow']

export function UserProfile({ username }: { username: string }) {
  const me = useApp((s) => s.user)
  const setUser = useApp((s) => s.setUser)
  const qc = useQueryClient()
  const [tab, setTab] = useState<'posts' | 'comments' | 'followers' | 'following' | 'saved' | 'badges'>('posts')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ displayName: '', bio: '', location: '', avatarColor: 'rose' })

  const { data, isLoading } = useQuery({
    queryKey: ['user', username, tab],
    queryFn: () => api.get<{ user: any; posts: any[]; comments: any[] }>(`/api/users/${username}?tab=${tab}`),
  })

  const u = data?.user

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (!u) {
    return (
      <Card className="p-10 text-center">
        <h3 className="text-lg font-semibold">Utilizador não encontrado</h3>
        <Button className="mt-4" onClick={() => navigate({ name: 'home' })}>Voltar ao início</Button>
      </Card>
    )
  }

  const isMe = me?.id === u.id
  const memberSince = new Date(u.createdAt).toLocaleDateString('pt-AO', { year: 'numeric', month: 'long' })

  function startEdit() {
    setForm({
      displayName: u.displayName || '',
      bio: u.bio || '',
      location: u.location || '',
      avatarColor: u.avatarColor,
    })
    setEditing(true)
  }

  async function saveEdit() {
    try {
      const res = await api.patch<{ user: any }>('/api/users/me', form)
      setUser(res.user)
      qc.invalidateQueries({ queryKey: ['user', username] })
      setEditing(false)
      toast.success('Perfil atualizado!')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate({ name: 'home' })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Profile header */}
      <Card className="overflow-hidden p-0">
        <div className="h-24 bg-angola-gradient" />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar name={u.displayName || u.username} color={u.avatarColor} size="xl" className="ring-4 ring-card" />
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight">{u.displayName || u.username}</h1>
                <p className="text-sm text-muted-foreground">u/{u.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              {isMe ? (
                !editing && (
                  <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Editar perfil
                  </Button>
                )
              ) : (
                <FollowButton username={u.username} initialFollowing={u.isFollowing} />
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3 rounded-lg border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} maxLength={40} />
                </div>
                <div className="space-y-1.5">
                  <Label>Província</Label>
                  <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                    <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} maxLength={280} />
              </div>
              <div className="space-y-1.5">
                <Label>Cor do avatar</Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setForm({ ...form, avatarColor: col })}
                      className={cn('h-8 w-8 rounded-full bg-gradient-to-br ring-2 transition-all',
                        avatarGradient(col),
                        form.avatarColor === col ? 'ring-foreground scale-110' : 'ring-transparent',
                      )}
                      aria-label={col}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancelar</Button>
                <Button size="sm" onClick={saveEdit} className="gap-1.5"><Save className="h-4 w-4" /> Guardar</Button>
              </div>
            </div>
          ) : (
            <>
              {u.bio && <p className="mt-3 max-w-2xl text-sm">{u.bio}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {u.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {u.location}</span>
                )}
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Membro desde {memberSince}</span>
                <KarmaBadge karma={u.karma} />
                <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {u._count.posts} publicações</span>
                <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {u._count.comments} respostas</span>
                {typeof u.followingCount === 'number' && (
                  <span className="inline-flex items-center gap-1"><UserPlus className="h-3.5 w-3.5" /> {u.followingCount} a seguir</span>
                )}
                {typeof u.followersCount === 'number' && (
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {u.followersCount} seguidores</span>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Activity heatmap */}
      <ActivityHeatmap username={u.username} />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          { k: 'posts', label: 'Publicações', icon: FileText },
          { k: 'comments', label: 'Respostas', icon: MessageSquare },
          { k: 'followers', label: 'Seguidores', icon: Users, count: u.followersCount },
          { k: 'following', label: 'A seguir', icon: UserPlus, count: u.followingCount },
          { k: 'saved', label: 'Guardados', icon: BookmarkIcon },
          { k: 'badges', label: 'Distinções', icon: Award },
        ] as const).map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.k ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent')}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
              {typeof (t as any).count === 'number' && (
                <span className={cn('rounded-full px-1.5 text-[10px] font-bold',
                  tab === t.k ? 'bg-primary-foreground/20' : 'bg-background text-muted-foreground')}>
                  {(t as any).count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {tab === 'badges' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {u.badges.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
              Ainda sem distinções. Participa para ganhar!
            </Card>
          ) : (
            u.badges.map((b: any) => {
              const c = colorOf(b.badge.color || 'amber')
              return (
                <Card key={b.id} className="flex items-center gap-3 p-4">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white', c.gradient)}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{b.badge.name}</div>
                    <div className="text-xs text-muted-foreground">{b.badge.description}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground/70">Conquistada {timeAgo(b.awardedAt)}</div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-2">
          {data?.posts.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Sem publicações ainda.</Card>
          ) : (
            data?.posts.map((p) => (
              <Card key={p.id} className="cursor-pointer p-4 transition-all hover:shadow-md" onClick={() => navigate({ name: 'post', id: p.id })}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CommunityIcon icon={p.community.icon} color={p.community.color} size="sm" className="h-4 w-4 rounded" />
                    {p.community.name}
                  </span>
                  <span>· {timeAgo(p.createdAt)}</span>
                </div>
                <h3 className="mt-1 font-semibold leading-tight hover:text-primary">{p.title}</h3>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {p.score}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {p.commentCount}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-2">
          {data?.comments.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Sem respostas ainda.</Card>
          ) : (
            data?.comments.map((c) => (
              <Card key={c.id} className="cursor-pointer p-4 transition-all hover:shadow-md" onClick={() => navigate({ name: 'post', id: c.post.id })}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CommunityIcon icon="message-circle" color={c.post.community?.color || 'rose'} size="sm" className="h-4 w-4 rounded" />
                    {c.post.community?.name}
                  </span>
                  <span>· {timeAgo(c.createdAt)}</span>
                  {c.isAnswer && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">⭐ Melhor</span>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{excerpt(c.body, 200)}</p>
                <p className="mt-1 text-xs text-muted-foreground">em: <span className="font-medium text-foreground">{c.post.title}</span></p>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {c.score}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {(tab === 'followers' || tab === 'following') && (
        <FollowList username={username} kind={tab} />
      )}

      {tab === 'saved' && (
        <SavedPostsList isMe={isMe} username={username} />
      )}
    </div>
  )
}

function FollowList({ username, kind }: { username: string; kind: 'followers' | 'following' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['follow-list', username, kind],
    queryFn: () => api.get<{ users: any[] }>(`/api/users/${username}/${kind}`),
  })
  const users = data?.users ?? []

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
  }
  if (users.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        {kind === 'followers' ? 'Ainda não tem seguidores.' : 'Ainda não segue ninguém.'}
      </Card>
    )
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {users.map((u) => (
        <Card
          key={u.id}
          className="flex cursor-pointer items-center gap-3 p-3 transition-all hover:shadow-md"
          onClick={() => navigate({ name: 'user', username: u.username })}
        >
          <Avatar name={u.displayName} color={u.avatarColor} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{u.displayName || u.username}</div>
            <div className="truncate text-xs text-muted-foreground">u/{u.username}</div>
            {u.bio && <div className="truncate text-xs text-muted-foreground">{u.bio}</div>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <KarmaBadge karma={u.karma} />
            {u.location && <span className="text-[10px] text-muted-foreground">📍 {u.location}</span>}
          </div>
        </Card>
      ))}
    </div>
  )
}

function SavedPostsList({ isMe, username }: { isMe: boolean; username: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: () => api.get<{ posts: any[] }>('/api/users/me/saved'),
    enabled: isMe,
  })
  const posts = data?.posts ?? []

  if (!isMe) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Os guardados são privados — só o próprio utilizador os vê.
      </Card>
    )
  }
  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
  }
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Ainda não guardaste publicações. Clica em 🔖 para guardar.
      </Card>
    )
  }
  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <Card key={p.id} className="cursor-pointer p-4 transition-all hover:shadow-md" onClick={() => navigate({ name: 'post', id: p.id })}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CommunityIcon icon="message-circle" color={p.community?.color || 'rose'} size="sm" className="h-4 w-4 rounded" />
            <span>{p.community?.name}</span>
            <span>· {timeAgo(p.savedAt)}</span>
          </div>
          <h3 className="mt-1 font-semibold leading-tight hover:text-primary">{p.title}</h3>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {p.score}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {p.commentCount}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
