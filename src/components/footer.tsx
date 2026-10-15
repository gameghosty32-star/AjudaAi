'use client'

import { useApp, navigate } from '@/lib/store'
import { Flame, Heart, Github, Twitter, Mail } from 'lucide-react'

export function Footer() {
  const setRoute = useApp((s) => s.setRoute)
  return (
    <footer className="mt-auto border-t bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 via-black to-amber-500 text-white">
                <Flame className="h-4 w-4" />
              </div>
              <span className="text-base font-bold">AjudaAí</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              A plataforma de ajuda feita por angolanos, para angolanos. 🇦🇴
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-accent" href="#" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
              <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-accent" href="#" aria-label="GitHub"><Github className="h-4 w-4" /></a>
              <a className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-accent" href="mailto:ola@ajudai.ao" aria-label="Email"><Mail className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Comunidades</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><button className="hover:text-foreground" onClick={() => navigate({ name: 'community', slug: 'luanda' })}>Luanda</button></li>
              <li><button className="hover:text-foreground" onClick={() => navigate({ name: 'community', slug: 'benguela' })}>Benguela</button></li>
              <li><button className="hover:text-foreground" onClick={() => navigate({ name: 'community', slug: 'tecnologia' })}>Tecnologia</button></li>
              <li><button className="hover:text-foreground" onClick={() => navigate({ name: 'community', slug: 'educacao' })}>Educação</button></li>
              <li><button className="hover:text-foreground" onClick={() => navigate({ name: 'communities' })}>Ver todas →</button></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">AjudaAí</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><button className="hover:text-foreground" onClick={() => setRoute({ name: 'home' })}>Início</button></li>
              <li><button className="hover:text-foreground" onClick={() => setRoute({ name: 'communities' })}>Explorar</button></li>
              <li><button className="hover:text-foreground" onClick={() => setRoute({ name: 'notifications' })}>Notificações</button></li>
              <li><span className="cursor-default">Sobre nós</span></li>
              <li><span className="cursor-default">Termos & condutas</span></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Regras da comunidade</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>🤝 Sê respeitoso e útil</li>
              <li>✅ Partilha informação verdadeira</li>
              <li>🚫 Sem spam nem auto-promoção</li>
              <li>🇦🇴 Usa português de Angola</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} AjudaAí — Feito com <Heart className="inline h-3 w-3 fill-rose-500 text-rose-500" /> em Angola</p>
          <p>v1.0 · <span className="font-medium">"Kumbu ku kuidi"</span></p>
        </div>
      </div>
    </footer>
  )
}
