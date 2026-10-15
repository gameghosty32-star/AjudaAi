'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Community } from '@/lib/api'
import { useApp, navigate } from '@/lib/store'
import { CommunityIcon } from '@/components/atoms'
import { colorOf } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Home, Compass, Trophy, Plus, Hash, MapPin, ChevronRight, Flame, Bell, Bookmark } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const route = useApp((s) => s.route)
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)
  const sidebarOpen = useApp((s) => s.sidebarOpen)
  const setSidebar = useApp((s) => s.setSidebar)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['communities', 'sidebar'],
    queryFn: () => api.get<{ communities: Community[] }>('/api/communities'),
  })
  const communities = data?.communities ?? []
  const provinces = communities.filter((c) => c.category === 'Província')
  const topics = communities.filter((c) => c.category === 'Tópico')

  const isActive = (name: string) => route.name === name

  // For logged-in users, "Guardados" navigates to their own profile saved tab
  function openMySaved() {
    if (user) navigate({ name: 'user', username: user.username })
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r bg-sidebar transition-transform lg:sticky lg:top-[57px] lg:z-30 lg:h-[calc(100vh-57px)] lg:translate-x-0 lg:bg-transparent',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b p-4 lg:hidden">
            <span className="font-bold">Menu</span>
            <Button variant="ghost" size="sm" onClick={() => setSidebar(false)}>✕</Button>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              <NavItem icon={Home} label="Início" active={isActive('home')} onClick={() => navigate({ name: 'home' })} />
              <NavItem icon={Compass} label="Explorar" active={isActive('communities')} onClick={() => navigate({ name: 'communities' })} />
              <NavItem icon={Bell} label="Notificações" active={isActive('notifications')} onClick={() => navigate({ name: 'notifications' })} badge={undefined} />
              <NavItem icon={Trophy} label="Top angolanos" active={isActive('leaderboard')} onClick={() => navigate({ name: 'leaderboard' })} />
            </nav>

            {user && (
              <div className="mt-4">
                <Button
                  className="w-full gap-1.5"
                  onClick={() => openComposer()}
                >
                  <Plus className="h-4 w-4" /> Criar publicação
                </Button>
              </div>
            )}

            {/* Provinces */}
            <Section title="Províncias" icon={MapPin}>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                : provinces.map((c) => (
                    <CommunityItem
                      key={c.id}
                      community={c}
                      active={route.name === 'community' && route.slug === c.slug}
                    />
                  ))}
            </Section>

            {/* Topics */}
            <Section title="Tópicos" icon={Hash}>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                : topics.map((c) => (
                    <CommunityItem
                      key={c.id}
                      community={c}
                      active={route.name === 'community' && route.slug === c.slug}
                    />
                  ))}
            </Section>

            <div className="mt-6 rounded-xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-3 text-xs">
              <p className="font-semibold text-foreground">🇦🇴 AjudaAí</p>
              <p className="mt-1 text-muted-foreground">
                A comunidade de ajuda feita por angolanos, para angolanos. Partilha, pergunta e responde.
              </p>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: any
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
      ) : null}
    </button>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function CommunityItem({ community, active }: { community: Community; active: boolean }) {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const [joined, setJoined] = useState(!!community.joined)
  const qc = useQueryClient()
  const c = colorOf(community.color)

  async function toggleJoin(e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) return openAuth('login')
    try {
      const res = await api.post<{ joined: boolean; members: number }>(`/api/communities/${community.slug}`)
      setJoined(res.joined)
      qc.invalidateQueries({ queryKey: ['communities'] })
      toast.success(res.joined ? `Juntaste-te a ${community.name}!` : `Saíste de ${community.name}.`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div
      onClick={() => navigate({ name: 'community', slug: community.slug })}
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors',
        active ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/60'
      )}
    >
      <CommunityIcon icon={community.icon} color={community.color} size="sm" className="h-7 w-7" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{community.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">{community.members.toLocaleString('pt-AO')} membros</div>
      </div>
      <button
        onClick={toggleJoin}
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors',
          joined
            ? 'text-muted-foreground hover:text-foreground'
            : cn(c.bgSoft, c.text, 'hover:opacity-80')
        )}
      >
        {joined ? '✓' : 'Entrar'}
      </button>
    </div>
  )
}
