'use client'

import { useApp, navigate } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, KarmaBadge } from '@/components/atoms'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Menu, Plus, Sun, Moon, Bell, LogOut, User as UserIcon, Settings, PenSquare, Flame, ChevronDown, Shield } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Header() {
  const user = useApp((s) => s.user)
  const setUser = useApp((s) => s.setUser)
  const openAuth = useApp((s) => s.openAuth)
  const openComposer = useApp((s) => s.openComposer)
  const toggleSidebar = useApp((s) => s.toggleSidebar)
  const route = useApp((s) => s.route)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    // mounted flag for theme icon (avoids hydration mismatch)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // fetch current user on mount
  useEffect(() => {
    api.get<{ user: any }>('/api/auth/me').then((r) => setUser(r.user)).catch(() => {})
  }, [setUser])

  // poll notifications (only when logged in; bell is hidden otherwise so stale state is fine)
  useEffect(() => {
    if (!user) return
    const load = () => api.get<{ unread: number }>('/api/notifications?unread=1').then((r) => setUnread(r.unread)).catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [user])

  const [q, setQ] = useState('')
  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (query.length < 2) return
    navigate({ name: 'search', q: query })
  }

  async function logout() {
    await api.post('/api/auth/logout')
    setUser(null)
    toast.success('Sessão terminada.')
    navigate({ name: 'home' })
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Mobile menu */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <button onClick={() => navigate({ name: 'home' })} className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 via-black to-amber-500 text-white shadow-sm">
            <Flame className="h-4 w-4" />
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-bold tracking-tight">AjudaAí</span>
            <span className="text-[10px] text-muted-foreground">🇦🇴 ajuda angolana</span>
          </div>
        </button>

        {/* Search */}
        <form onSubmit={submitSearch} className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisa perguntas, comunidades, pessoas…"
            className="h-9 w-full rounded-full border bg-secondary/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/30"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Tema">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {user && (
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate({ name: 'notifications' })} aria-label="Notificações">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Button>
          )}

          {user ? (
            <Button size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={() => openComposer()}>
              <PenSquare className="h-4 w-4" /> Publicar
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => openAuth('login')} className="hidden sm:inline-flex">
                Entrar
              </Button>
              <Button size="sm" onClick={() => openAuth('register')} className="gap-1">
                <Plus className="h-4 w-4" /> Junta-te
              </Button>
            </>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full p-0.5 transition-transform hover:scale-105" aria-label="Conta">
                  <Avatar name={user.displayName} color={user.avatarColor} size="sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <Avatar name={user.displayName} color={user.avatarColor} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{user.displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">u/{user.username}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <KarmaBadge karma={user.karma} />
                    {user.location && <span className="text-xs text-muted-foreground">📍 {user.location}</span>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ name: 'user', username: user.username })}>
                  <UserIcon className="mr-2 h-4 w-4" /> O meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openComposer()}>
                  <PenSquare className="mr-2 h-4 w-4" /> Nova publicação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'notifications' })}>
                  <Bell className="mr-2 h-4 w-4" /> Notificações {unread > 0 && `(${unread})`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'settings' })}>
                  <Settings className="mr-2 h-4 w-4" /> Definições
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate({ name: 'admin' })}>
                    <Shield className="mr-2 h-4 w-4" /> Painel de Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
