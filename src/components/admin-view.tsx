'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, KarmaBadge, CommunityIcon } from '@/components/atoms'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { timeAgo, formatNumber } from '@/lib/format'
import {
  Shield, LayoutDashboard, Users, MessageSquare, FileText, Settings as SettingsIcon,
  Trash2, Search, Save, Loader2, ArrowLeft, TrendingUp, UserPlus, Activity, AlertTriangle,
  Crown, ShieldCheck, ShieldAlert,
} from 'lucide-react'

type Tab = 'dashboard' | 'users' | 'communities' | 'posts' | 'comments' | 'settings'

export function AdminView() {
  const user = useApp((s) => s.user)
  const [tab, setTab] = useState<Tab>('dashboard')

  if (!user || user.role !== 'admin') {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Acesso restrito</h3>
        <p className="mt-1 text-sm text-muted-foreground">Apenas administradores podem aceder a esta área.</p>
        <Button className="mt-4" onClick={() => navigate({ name: 'home' })}>Voltar ao início</Button>
      </Card>
    )
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { key: 'users', label: 'Utilizadores', icon: Users },
    { key: 'communities', label: 'Comunidades', icon: MessageSquare },
    { key: 'posts', label: 'Publicações', icon: FileText },
    { key: 'comments', label: 'Comentários', icon: MessageSquare },
    { key: 'settings', label: 'Configurações', icon: SettingsIcon },
  ]

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate({ name: 'home' })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/15 via-black/5 to-amber-500/15 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-black text-white shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de Administração</h1>
            <p className="text-sm text-muted-foreground">Gerir utilizadores, comunidades, conteúdo e configurações da plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'communities' && <CommunitiesTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'comments' && <CommentsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}

// ===== Dashboard =====
function DashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<any>('/api/admin/stats'),
  })

  if (isLoading) {
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
  }

  const totals = data?.totals ?? {}
  const recent = data?.recent ?? {}
  const statCards = [
    { label: 'Utilizadores', value: totals.users, icon: Users, color: 'from-rose-500 to-rose-700', recent: `+${recent.newUsers7d} esta semana` },
    { label: 'Comunidades', value: totals.communities, icon: MessageSquare, color: 'from-emerald-500 to-emerald-700', recent: null },
    { label: 'Publicações', value: totals.posts, icon: FileText, color: 'from-amber-500 to-amber-700', recent: `+${recent.newPosts7d} esta semana` },
    { label: 'Comentários', value: totals.comments, icon: MessageSquare, color: 'from-cyan-500 to-cyan-700', recent: `+${recent.newComments7d} esta semana` },
    { label: 'Votos', value: totals.votes, icon: TrendingUp, color: 'from-violet-500 to-violet-700', recent: null },
    { label: 'Distinções', value: totals.badges, icon: Crown, color: 'from-orange-500 to-orange-700', recent: null },
  ]

  const posts14d = data?.posts14d ?? []
  const users14d = data?.users14d ?? []
  const maxPosts = Math.max(1, ...posts14d.map((d: any) => d.count))
  const maxUsers = Math.max(1, ...users14d.map((d: any) => d.count))

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-4">
              <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white', s.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold tabular-nums">{formatNumber(s.value || 0)}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
              {s.recent && <div className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">{s.recent}</div>}
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" /> Novas publicações (14 dias)
          </h3>
          <div className="flex h-28 items-end gap-1">
            {posts14d.map((d: any) => (
              <div key={d.date} className="group relative flex flex-1 flex-col justify-end" title={`${d.date}: ${d.count}`}>
                <div className="w-full rounded-t bg-rose-400 transition-all group-hover:bg-rose-500 dark:bg-rose-600" style={{ height: `${(d.count / maxPosts) * 100}%` }} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <UserPlus className="h-4 w-4 text-primary" /> Novos utilizadores (14 dias)
          </h3>
          <div className="flex h-28 items-end gap-1">
            {users14d.map((d: any) => (
              <div key={d.date} className="group relative flex flex-1 flex-col justify-end" title={`${d.date}: ${d.count}`}>
                <div className="w-full rounded-t bg-emerald-400 transition-all group-hover:bg-emerald-500 dark:bg-emerald-600" style={{ height: `${(d.count / maxUsers) * 100}%` }} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent activity summary */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Resumo de atividade
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{recent.newUsers30d || 0}</div>
            <div className="text-xs text-muted-foreground">Novos utilizadores (30d)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{recent.newUsers7d || 0}</div>
            <div className="text-xs text-muted-foreground">Novos utilizadores (7d)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{recent.newPosts7d || 0}</div>
            <div className="text-xs text-muted-foreground">Novas publicações (7d)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{recent.newComments7d || 0}</div>
            <div className="text-xs text-muted-foreground">Novos comentários (7d)</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ===== Users =====
function UsersTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get<{ users: any[]; total: number }>(`/api/admin/users?q=${encodeURIComponent(search)}&limit=100`),
  })
  const users = data?.users ?? []

  async function changeRole(userId: string, role: string) {
    try {
      await api.patch('/api/admin/users', { userId, role })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(`Utilizador atualizado para ${role}.`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Apagar o utilizador @${username}? Todas as suas publicações e comentários serão removidos.`)) return
    try {
      await api.delete(`/api/admin/users?userId=${userId}`)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Utilizador apagado.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); setSearch(q) }} className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome, email ou username…" className="pl-9" />
      </form>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum utilizador encontrado.</Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{data?.total || 0} utilizadores no total</p>
          {users.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <Avatar name={u.displayName} color={u.avatarColor} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{u.displayName || u.username}</span>
                  {u.role === 'admin' && <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><Crown className="h-2.5 w-2.5" /> Admin</span>}
                  {u.role === 'moderator' && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><ShieldCheck className="h-2.5 w-2.5" /> Mod</span>}
                </div>
                <div className="truncate text-xs text-muted-foreground">u/{u.username} · {u.email}</div>
                <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <KarmaBadge karma={u.karma} />
                  <span>{u.postCount} posts</span>
                  <span>{u.commentCount} comentários</span>
                  <span>Membro {timeAgo(u.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="h-8 rounded-lg border bg-secondary px-2 text-xs font-medium outline-none hover:bg-accent"
                >
                  <option value="member">Membro</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Admin</option>
                </select>
                <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id, u.username)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Communities =====
function CommunitiesTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-communities', search],
    queryFn: () => api.get<{ communities: any[] }>(`/api/admin/communities?q=${encodeURIComponent(search)}`),
  })
  const communities = data?.communities ?? []

  async function deleteCommunity(id: string, name: string) {
    if (!confirm(`Apagar a comunidade "${name}"? Todas as publicações dentro dela serão removidas.`)) return
    try {
      await api.delete(`/api/admin/communities?communityId=${id}`)
      qc.invalidateQueries({ queryKey: ['admin-communities'] })
      toast.success('Comunidade apagada.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); setSearch(q) }} className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar comunidade…" className="pl-9" />
      </form>

      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {communities.map((c) => (
            <Card key={c.id} className="flex items-center gap-3 p-3">
              <CommunityIcon icon={c.icon} color={c.color} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">c/{c.slug} · {c.category}</div>
                <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{c.members} membros</span>
                  <span>{c.postCount} publicações</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteCommunity(c.id, c.name)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Posts =====
function PostsTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', search, offset],
    queryFn: () => api.get<{ posts: any[]; total: number }>(`/api/admin/posts?q=${encodeURIComponent(search)}&limit=20&offset=${offset}`),
  })
  const posts = data?.posts ?? []

  async function deletePost(id: string, title: string) {
    if (!confirm(`Apagar a publicação "${title.slice(0, 50)}"?`)) return
    try {
      await api.delete(`/api/admin/posts?postId=${id}`)
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      toast.success('Publicação apagada.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); setSearch(q); setOffset(0) }} className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar publicações…" className="pl-9" />
      </form>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma publicação encontrada.</Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{data?.total || 0} publicações no total</p>
          {posts.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <button onClick={() => navigate({ name: 'post', id: p.id })} className="block truncate text-left text-sm font-medium hover:text-primary hover:underline">
                  {p.title}
                </button>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>c/{p.community.slug}</span>
                  <span>· u/{p.author.username}</span>
                  <span>· {p.score} pontos</span>
                  <span>· {p.commentCount} comentários</span>
                  <span>· {timeAgo(p.createdAt)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deletePost(p.id, p.title)} className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>← Anterior</Button>
            <span className="text-xs text-muted-foreground">{offset + 1}–{Math.min(offset + 20, data?.total || 0)} de {data?.total || 0}</span>
            <Button variant="outline" size="sm" disabled={offset + 20 >= (data?.total || 0)} onClick={() => setOffset(offset + 20)}>Próximo →</Button>
          </div>
        </>
      )}
    </div>
  )
}

// ===== Comments =====
function CommentsTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-comments', search, offset],
    queryFn: () => api.get<{ comments: any[]; total: number }>(`/api/admin/comments?q=${encodeURIComponent(search)}&limit=20&offset=${offset}`),
  })
  const comments = data?.comments ?? []

  async function deleteComment(id: string) {
    if (!confirm('Apagar este comentário?')) return
    try {
      await api.delete(`/api/admin/comments?commentId=${id}`)
      qc.invalidateQueries({ queryKey: ['admin-comments'] })
      toast.success('Comentário apagado.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); setSearch(q); setOffset(0) }} className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar comentários…" className="pl-9" />
      </form>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : comments.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum comentário encontrado.</Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{data?.total || 0} comentários no total</p>
          {comments.map((c) => (
            <Card key={c.id} className="flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{c.body}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>u/{c.author.username}</span>
                  <span>· em: {c.post.title.slice(0, 40)}</span>
                  <span>· {c.score} pontos</span>
                  {c.isAnswer && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">⭐ Melhor</span>}
                  <span>· {timeAgo(c.createdAt)}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteComment(c.id)} className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>← Anterior</Button>
            <span className="text-xs text-muted-foreground">{offset + 1}–{Math.min(offset + 20, data?.total || 0)} de {data?.total || 0}</span>
            <Button variant="outline" size="sm" disabled={offset + 20 >= (data?.total || 0)} onClick={() => setOffset(offset + 20)}>Próximo →</Button>
          </div>
        </>
      )}
    </div>
  )
}

// ===== Settings =====
function SettingsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<{ settings: any }>('/api/admin/settings'),
  })
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  // sync form when data loads
  if (data && Object.keys(form).length === 0 && !isLoading) {
    setForm(data.settings)
  }

  async function save() {
    setSaving(true)
    try {
      await api.put('/api/admin/settings', form)
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      toast.success('Configurações guardadas!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>

  const set = (k: string, v: any) => setForm({ ...form, [k]: v })

  return (
    <div className="space-y-4">
      {/* Site info */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><SettingsIcon className="h-4 w-4 text-primary" /> Informação do site</h3>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome do site</Label>
            <Input value={form.siteName || ''} onChange={(e) => set('siteName', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Slogan</Label>
            <Input value={form.siteTagline || ''} onChange={(e) => set('siteTagline', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Descrição (SEO)</Label>
            <Textarea value={form.siteDescription || ''} onChange={(e) => set('siteDescription', e.target.value)} rows={2} />
          </div>
          <div>
            <Label className="mb-1 block">Mensagem de boas-vindas (notificação inicial)</Label>
            <Textarea value={form.welcomeMessage || ''} onChange={(e) => set('welcomeMessage', e.target.value)} rows={3} />
          </div>
        </div>
      </Card>

      {/* Feature toggles */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Shield className="h-4 w-4 text-primary" /> Funcionalidades</h3>
        <div className="space-y-3">
          <ToggleRow label="Permitir novos registos" desc="Novos utilizadores podem criar conta" checked={form.allowRegistration === 'true'} onChange={(v) => set('allowRegistration', String(v))} />
          <ToggleRow label="Permitir publicações" desc="Utilizadores podem criar publicações" checked={form.allowPosting === 'true'} onChange={(v) => set('allowPosting', String(v))} />
          <ToggleRow label="Permitir comentários" desc="Utilizadores podem comentar" checked={form.allowComments === 'true'} onChange={(v) => set('allowComments', String(v))} />
          <ToggleRow label="Verificação de email" desc="Exigir confirmação de email no registo" checked={form.requireEmailVerification === 'true'} onChange={(v) => set('requireEmailVerification', String(v))} />
          <ToggleRow label="Modo de manutenção" desc="Bloqueia o acesso à plataforma (apenas admins)" checked={form.maintenanceMode === 'true'} onChange={(v) => set('maintenanceMode', String(v))} warn />
        </div>
      </Card>

      {/* Limits */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-primary" /> Limites de conteúdo</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1 block">Tamanho máximo do corpo da publicação</Label>
            <Input type="number" value={form.maxPostBodyLength || '8000'} onChange={(e) => set('maxPostBodyLength', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Tamanho máximo do comentário</Label>
            <Input type="number" value={form.maxCommentBodyLength || '4000'} onChange={(e) => set('maxCommentBodyLength', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Global rules */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Regras globais da comunidade</h3>
        <Textarea value={form.globalRules || ''} onChange={(e) => set('globalRules', e.target.value)} rows={6} className="resize-y" />
        <p className="mt-1 text-[11px] text-muted-foreground">Uma regra por linha. Aplicadas a todas as comunidades por defeito.</p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar configurações
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange, warn }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1.5">
          <Label className="font-medium">{label}</Label>
          {warn && checked && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
