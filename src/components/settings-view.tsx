'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApp, navigate } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, KarmaBadge } from '@/components/atoms'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Settings, Sun, Moon, Bell, Mail, Flame, Clock, TrendingUp, Sparkles, Shield, ArrowLeft, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_PREFS = {
  emailNotifications: true,
  notifyOnReply: true,
  notifyOnVote: true,
  notifyOnFollow: true,
  defaultSort: 'hot' as 'hot' | 'new' | 'top',
  showKarma: true,
}

export function SettingsView() {
  const user = useApp((s) => s.user)
  const setUser = useApp((s) => s.setUser)
  const openAuth = useApp((s) => s.openAuth)
  const qc = useQueryClient()
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)

  const { data } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => api.get<{ preferences: any }>('/api/users/me/preferences'),
    enabled: !!user,
  })

  useEffect(() => {
    if (data?.preferences) {
      setPrefs({ ...DEFAULT_PREFS, ...data.preferences })
    }
  }, [data])

  if (!user) {
    return (
      <Card className="p-10 text-center">
        <Settings className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Inicia sessão para ver as definições</h3>
        <Button className="mt-4" onClick={() => openAuth('login')}>Entrar</Button>
      </Card>
    )
  }

  async function savePref(key: string, value: any) {
    const newPrefs = { ...prefs, [key]: value }
    setPrefs(newPrefs)
    setSaving(true)
    try {
      await api.put('/api/users/me/preferences', { [key]: value })
      qc.invalidateQueries({ queryKey: ['preferences'] })
      toast.success('Definições guardadas.')
    } catch (e: any) {
      setPrefs(prefs)
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate({ name: 'home' })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/15 to-rose-500/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-rose-600 text-white shadow-sm">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Definições</h1>
            <p className="text-sm text-muted-foreground">Personaliza a tua experiência no AjudaAí</p>
          </div>
        </div>
      </div>

      {/* Account */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" /> Conta
        </h2>
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName} color={user.avatarColor} size="lg" />
          <div>
            <div className="font-semibold">{user.displayName}</div>
            <div className="text-sm text-muted-foreground">u/{user.username}</div>
          </div>
          <div className="ml-auto">
            <KarmaBadge karma={user.karma} />
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate({ name: 'user', username: user.username })}>
          Ver perfil
        </Button>
      </Card>

      {/* Appearance */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Sun className="h-4 w-4 text-primary" /> Aparência
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Tema</Label>
              <p className="text-xs text-muted-foreground">Escolhe o modo claro ou escuro</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
              <button
                onClick={() => setTheme('light')}
                className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
              >
                <Sun className="h-3.5 w-3.5" /> Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
              >
                <Moon className="h-3.5 w-3.5" /> Escuro
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Mostrar karma publicamente</Label>
              <p className="text-xs text-muted-foreground">Outros utilizadores veem o teu karma no perfil</p>
            </div>
            <Switch checked={prefs.showKarma} onCheckedChange={(v) => savePref('showKarma', v)} />
          </div>
        </div>
      </Card>

      {/* Default sort */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Feed
        </h2>
        <div>
          <Label className="font-medium">Ordenação padrão do feed</Label>
          <p className="mb-2 text-xs text-muted-foreground">Como as publicações aparecem quando abres o AjudaAí</p>
          <div className="flex flex-wrap gap-1.5">
            {([
              { k: 'hot', label: 'Em alta', icon: Flame },
              { k: 'new', label: 'Novas', icon: Clock },
              { k: 'top', label: 'Top', icon: TrendingUp },
            ] as const).map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.k}
                  onClick={() => savePref('defaultSort', s.k)}
                  className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    prefs.defaultSort === s.k ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent')}
                >
                  <Icon className="h-3.5 w-3.5" /> {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Bell className="h-4 w-4 text-primary" /> Notificações
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="font-medium">Notificações por email</Label>
                <p className="text-xs text-muted-foreground">Recebe um resumo periódico</p>
              </div>
            </div>
            <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => savePref('emailNotifications', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Quando alguém responde</Label>
              <p className="text-xs text-muted-foreground">Notificar ao responderes às tuas publicações/comentários</p>
            </div>
            <Switch checked={prefs.notifyOnReply} onCheckedChange={(v) => savePref('notifyOnReply', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Quando recebes votos</Label>
              <p className="text-xs text-muted-foreground">Notificar quando alguém vota nas tuas publicações</p>
            </div>
            <Switch checked={prefs.notifyOnVote} onCheckedChange={(v) => savePref('notifyOnVote', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Quando te seguem</Label>
              <p className="text-xs text-muted-foreground">Notificar quando ganhas um novo seguidor</p>
            </div>
            <Switch checked={prefs.notifyOnFollow} onCheckedChange={(v) => savePref('notifyOnFollow', v)} />
          </div>
        </div>
      </Card>

      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> A guardar…
        </div>
      )}
    </div>
  )
}
