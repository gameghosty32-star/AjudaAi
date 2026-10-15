'use client'

import { useQuery } from '@tanstack/react-query'
import { useApp, navigate } from '@/lib/store'
import { api, type PostSummary, type Community } from '@/lib/api'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Footer } from '@/components/footer'
import { AuthDialog } from '@/components/auth-dialog'
import { Composer } from '@/components/composer'
import { Feed } from '@/components/feed'
import { CommunitiesView } from '@/components/communities-view'
import { CommunityView } from '@/components/community-view'
import { PostDetail } from '@/components/post-detail'
import { UserProfile } from '@/components/user-profile'
import { SearchView } from '@/components/search-view'
import { NotificationsView } from '@/components/notifications-view'
import { LeaderboardView } from '@/components/leaderboard-view'
import { LeaderboardWidget } from '@/components/leaderboard-widget'
import { TrendingTagsWidget } from '@/components/trending-tags-widget'
import { TagView } from '@/components/tag-view'
import { SettingsView } from '@/components/settings-view'
import { AdminView } from '@/components/admin-view'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, CommunityIcon, KarmaBadge } from '@/components/atoms'
import { colorOf } from '@/lib/theme'
import { timeAgo, formatNumber } from '@/lib/format'
import { Flame, PenSquare, Sparkles, TrendingUp, ArrowRight, Lightbulb, Users, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppShell() {
  const route = useApp((s) => s.route)
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-0 sm:px-4">
        <Sidebar />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 lg:pr-0">
          {route.name === 'home' && <HomeHero />}
          <div className="flex gap-6">
            <div className="min-w-0 flex-1">
              {route.name === 'home' && <Feed />}
              {route.name === 'community' && <CommunityView slug={route.slug} />}
              {route.name === 'communities' && <CommunitiesView />}
              {route.name === 'post' && <PostDetail id={route.id} />}
              {route.name === 'user' && <UserProfile username={route.username} />}
              {route.name === 'search' && <SearchView q={route.q} />}
              {route.name === 'notifications' && <NotificationsView />}
              {route.name === 'leaderboard' && <LeaderboardView />}
              {route.name === 'tag' && <TagView tag={route.tag} />}
              {route.name === 'settings' && <SettingsView />}
              {route.name === 'admin' && <AdminView />}
              {route.name === 'composer' && <Feed />}
            </div>
            <RightRail />
          </div>
        </main>
      </div>
      <Footer />
      <AuthDialog />
      <Composer />
      <MobileComposerFab />
    </div>
  )
}

function HomeHero() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)
  if (user) return null
  return (
    <Card className="mb-4 overflow-hidden border-0 p-0">
      <div className="bg-angola-gradient px-5 py-6 text-white sm:px-7 sm:py-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> A comunidade de ajuda de Angola
            </div>
            <h1 className="text-balance text-2xl font-bold leading-tight sm:text-3xl">
              Pergunta. Responde. Ajuda outros angolanos. 🇦🇴
            </h1>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              De Luanda ao Moxico, do emprego à tecnologia — junta-te a milhares de angolanos a partilhar conhecimento.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => openAuth('register')} className="gap-1.5 bg-white text-primary hover:bg-white/90">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => openAuth('login')} variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                Já tenho conta
              </Button>
            </div>
          </div>
          <div className="hidden shrink-0 grid grid-cols-3 gap-2 sm:grid lg:grid">
            <Stat icon={Users} value="10k+" label="angolanos" />
            <Stat icon={Flame} value="500+" label="perguntas" />
            <Stat icon={ShieldCheck} value="20+" label="comunidades" />
          </div>
        </div>
      </div>
    </Card>
  )
}

function Stat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur">
      <Icon className="mx-auto mb-1 h-4 w-4" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-white/80">{label}</div>
    </div>
  )
}

function RightRail() {
  const route = useApp((s) => s.route)
  // hide on small screens, and on post/user detail (full width better)
  if (route.name === 'post' || route.name === 'user' || route.name === 'leaderboard' || route.name === 'tag' || route.name === 'settings' || route.name === 'admin') return null

  return (
    <aside className="hidden w-72 shrink-0 py-1 lg:block">
      <div className="sticky top-[73px] space-y-4">
        <TrendingCard />
        <LeaderboardWidget />
        <TrendingTagsWidget />
        <AboutCard />
        <TipsCard />
      </div>
    </aside>
  )
}

function TrendingCard() {
  const { data } = useQuery({
    queryKey: ['trending', 'rail'],
    queryFn: () => api.get<{ posts: PostSummary[] }>('/api/posts?sort=top&limit=5'),
  })
  const posts = data?.posts ?? []
  if (posts.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <TrendingUp className="h-4 w-4 text-primary" /> Em alta hoje
      </h3>
      <ol className="space-y-2.5">
        {posts.map((p, i) => (
          <li key={p.id}>
            <button
              onClick={() => navigate({ name: 'post', id: p.id })}
              className="flex w-full items-start gap-2 text-left text-sm hover:text-primary"
            >
              <span className="mt-0.5 text-xs font-bold text-muted-foreground">{i + 1}.</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 leading-snug">{p.title}</span>
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    <CommunityIcon icon={p.community.icon} color={p.community.color} size="sm" className="h-3 w-3 rounded" />
                    {p.community.name}
                  </span>
                  <span>· {formatNumber(p.score)} 🔥</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function AboutCard() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-angola-gradient p-4 text-white">
        <h3 className="flex items-center gap-1.5 font-semibold"><Sparkles className="h-4 w-4" /> Sobre o AjudaAí</h3>
      </div>
      <div className="p-4 text-sm text-muted-foreground">
        <p>Uma plataforma livre onde angolanos se ajudam mutuamente. Faz uma pergunta, responde com conhecimento, ganha karma e distinções.</p>
        <ul className="mt-3 space-y-1.5">
          <li className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Pergunta com clareza</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Responde com verdade</li>
          <li className="flex items-center gap-2"><Flame className="h-3.5 w-3.5 text-rose-500" /> Ganha karma a ajudar</li>
        </ul>
        <Button
          size="sm"
          className="mt-3 w-full gap-1.5"
          onClick={() => (user ? openComposer() : openAuth('register'))}
        >
          <PenSquare className="h-3.5 w-3.5" /> {user ? 'Publicar' : 'Junta-te'}
        </Button>
      </div>
    </Card>
  )
}

function TipsCard() {
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-sm font-semibold">💡 Dicas</h3>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        <li>• Usa títulos descritivos nas perguntas</li>
        <li>• Escolhe a comunidade certa (província ou tópico)</li>
        <li>• Marca a melhor resposta para ajudar outros</li>
        <li>• Vota nas respostas úteis 👍</li>
      </ul>
    </Card>
  )
}

function MobileComposerFab() {
  const user = useApp((s) => s.user)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)
  if (!user) return null
  return (
    <button
      onClick={() => openComposer()}
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 lg:hidden"
      aria-label="Criar publicação"
    >
      <PenSquare className="h-6 w-6" />
    </button>
  )
}
