'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2, Flame, MapPin, Sparkles, MessageCircle, Heart } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PROVINCES = [
  'Luanda', 'Benguela', 'Huíla', 'Huambo', 'Cabinda', 'Namibe', 'Malanje',
  'Uíge', 'Bié', 'Moxico', 'Cuando-Cubango', 'Cunene', 'Bengo', 'Kwanza-Norte',
  'Kwanza-Sul', 'Zaire', 'Lunda-Norte', 'Lunda-Sul', 'Cuanza-Sul', 'Diáspora',
]

export function AuthDialog() {
  const open = useApp((s) => s.authOpen)
  const mode = useApp((s) => s.authMode)
  const openAuth = useApp((s) => s.openAuth)
  const closeAuth = useApp((s) => s.closeAuth)
  const setUser = useApp((s) => s.setUser)
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', displayName: '', location: '' })

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<{ user: any; error?: string }>('/api/auth/login', loginForm)
      setUser(res.user)
      toast.success(`Bem-vindo de volta, ${res.user.displayName}!`)
      closeAuth()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function register(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<{ user: any; error?: string }>('/api/auth/register', regForm)
      setUser(res.user)
      toast.success(`Bem-vindo ao AjudaAí, ${res.user.displayName}! 🎉`)
      closeAuth()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? openAuth(mode) : closeAuth())}>
      <DialogContent className="max-w-md gap-0 p-0">
        <div className="bg-angola-gradient px-6 py-5 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">AjudaAí 🇦🇴</DialogTitle>
              <DialogDescription className="text-white/80 text-xs">
                A comunidade de ajuda angolana
              </DialogDescription>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="rounded-lg bg-white/10 py-1.5"><Sparkles className="mx-auto mb-0.5 h-3 w-3" /> Pergunta</div>
            <div className="rounded-lg bg-white/10 py-1.5"><MessageCircle className="mx-auto mb-0.5 h-3 w-3" /> Responde</div>
            <div className="rounded-lg bg-white/10 py-1.5"><Heart className="mx-auto mb-0.5 h-3 w-3" /> Ajuda</div>
          </div>
        </div>

        <Tabs defaultValue={mode} className="p-6" onValueChange={(v) => openAuth(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={login} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="li-identifier">Utilizador ou email</Label>
                <Input
                  id="li-identifier"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  placeholder="joao_tech ou joao@exemplo.ao"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="li-password">Palavra-passe</Label>
                <Input
                  id="li-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Conta demo: <button type="button" className="font-semibold text-foreground underline" onClick={() => setLoginForm({ identifier: 'joao_tech', password: 'ajudai123' })}>joao_tech / ajudai123</button>
              </p>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form onSubmit={register} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-username">Utilizador *</Label>
                  <Input
                    id="reg-username"
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    placeholder="joao_tech"
                    pattern="[a-zA-Z0-9_]{3,20}"
                    title="3-20 letras, números ou _"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-display">Nome</Label>
                  <Input
                    id="reg-display"
                    value={regForm.displayName}
                    onChange={(e) => setRegForm({ ...regForm, displayName: e.target.value })}
                    placeholder="João Tech"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="joao@exemplo.ao"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Palavra-passe *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Mín. 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-location" className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Província</Label>
                <Select value={regForm.location} onValueChange={(v) => setRegForm({ ...regForm, location: v })}>
                  <SelectTrigger id="reg-location"><SelectValue placeholder="Escolhe a tua província" /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar a minha conta
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Ao criares conta, aceitas ajudar com respeito e verdade. 🤝
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
