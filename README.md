# AjudaAí — Plataforma de Ajuda de Angola 🇦🇴

Plataforma de ajuda estilo Reddit + Quora, direcionada ao público angolano, em português (pt-AO). Comunidades baseadas em províncias e tópicos angolanos.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite)
- **State**: Zustand (client) + TanStack Query (server)
- **Auth**: Cookie-session com bcryptjs
- **Theme**: next-themes (light/dark)

## Funcionalidades

### Core
- Autenticação (registo/login/logout) com sessão por cookie
- Feed com ordenação (em alta / novas / top / a subir) e scroll infinito
- Publicações (perguntas / discussões / links) com markdown, imagens e etiquetas
- Comentários aninhados com votação, edição, eliminação e imagens
- Votação em publicações e comentários com sincronização de karma
- Pesquisa com filtros (tipo, comunidade, ordenação) e paginação
- Perfis de utilizador com karma, distinções (badges), mapa de calor de atividade
- Sistema de seguir utilizadores + feed "A seguir"
- Listas de seguidores/seguindo
- Notificações (respostas, votos, seguidores, melhores respostas, distinções)
- Marcadores (bookmarks) de publicações
- Leaderboard (top angolanos por karma)
- Página de etiquetas (clicável, com scroll infinito)
- Publicações relacionadas (por etiquetas partilhadas)
- Distinções automáticas (gamification)
- Preferências de notificação respeitadas pelo backend

### Comunidades
- 10 províncias angolanas + 10 tópicos
- Vista de comunidade com banner, membros, regras, filtros
- Edição de descrição/regras (moderadores)
- Lista de moderadores
- Analytics (estatísticas, gráfico de atividade 30 dias, distribuição por tipo)

### Admin
- Painel de administração completo (6 tabs)
- Dashboard com estatísticas globais + gráficos (14 dias)
- Gestão de utilizadores (procurar, mudar role, banir)
- Gestão de comunidades (procurar, apagar)
- Gestão de publicações (procurar, paginar, apagar)
- Gestão de comentários (procurar, paginar, apagar)
- Configurações da plataforma (nome, slogan, toggles, limites, regras globais, modo manutenção)

### UX
- Tema claro/escuro
- Rascunho automático no composer (localStorage)
- Autocompletar de etiquetas
- Suporte PWA (manifest, meta tags)
- Upload de imagens (JPEG/PNG/WebP/GIF, máx. 4MB)
- Markdown rendering seguro (sem dangerouslySetInnerHTML)
- Design responsivo (mobile-first)
- Footer fixo no fundo

## Instalação

```bash
# 1. Instalar dependências
bun install

# 2. Configurar base de dados
cp .env.example .env  # ou criar .env com DATABASE_URL="file:/home/z/my-project/db/custom.db"
bun run db:push

# 3. Seed com dados de demonstração (20 comunidades, 29 utilizadores, 12 publicações)
bun run scripts/seed.ts

# 4. Iniciar servidor de desenvolvimento
bun run dev
```

Aceder a `http://localhost:3000`.

## Conta de demonstração

- **Utilizador**: `joao_tech`
- **Palavra-passe**: `ajudai123`
- (joao_tech é administrador — acede ao painel de admin via menu de conta)

## Estrutura do projeto

```
prisma/
  schema.prisma          # Schema da base de dados (User, Community, Post, Comment, Vote, Tag, Follow, SavedPost, Notification, Badge, Setting, etc.)
  custom.db              # Base de dados SQLite (gerada pelo db:push)
scripts/
  seed.ts                # Script de seed com dados angolanos
src/
  app/
    api/                 # API routes (auth, posts, comments, votes, communities, search, admin, etc.)
    layout.tsx           # Layout root com providers
    page.tsx             # Página única (SPA com router Zustand)
    globals.css          # Estilos globais + tema Angola
  components/
    app-shell.tsx        # Shell da app (header, sidebar, content, footer)
    header.tsx           # Header com pesquisa, auth, tema
    sidebar.tsx          # Sidebar com navegação + comunidades
    feed.tsx             # Feed com scroll infinito
    post-card.tsx        # Cartão de publicação
    post-detail.tsx      # Detalhe de publicação + comentários
    comment-tree.tsx     # Árvore de comentários
    composer.tsx         # Dialog de criar publicação
    admin-view.tsx       # Painel de administração
    settings-view.tsx    # Definições de utilizador
    ... (30+ componentes)
  lib/
    auth.ts              # Autenticação por cookie-session
    db.ts                # Cliente Prisma
    store.ts             # Store Zustand (router SPA)
    api.ts               # Cliente API + tipos
    format.ts            # Helpers de formatação (timeAgo, excerpt, stripMarkdown)
    theme.ts             # Cores e ícones de comunidade
    badges.ts            # Lógica de distinções automáticas
    notification-prefs.ts # Preferências de notificação
    post-helpers.ts      # Helpers de publicações (hotScore, fetchPostById)
    use-persistent-state.ts # Hook de estado persistente (localStorage)
  hooks/
    use-toast.ts
    use-mobile.ts
  components/ui/         # Componentes shadcn/ui
public/
  manifest.json          # PWA manifest
  logo.svg
```

## Scripts

```bash
bun run dev        # Servidor de desenvolvimento (porta 3000)
bun run lint       # ESLint
bun run db:push    # Push schema para base de dados
bun run db:generate # Gerar Prisma Client
bun run db:reset   # Reset base de dados
bun run scripts/seed.ts  # Seed com dados de demonstração
```

## API

Todas as APIs estão em `/api/*`. Principais endpoints:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/posts`, `POST /api/posts`, `GET /api/posts/[id]`, `PATCH /api/posts/[id]`, `DELETE /api/posts/[id]`
- `POST /api/posts/[id]/vote`, `POST /api/posts/[id]/save`, `GET /api/posts/[id]/comments`, `GET /api/posts/[id]/related`
- `POST /api/comments/[id]/vote`, `PATCH /api/comments/[id]`, `DELETE /api/comments/[id]`, `POST /api/comments/[id]/answer`
- `GET /api/communities`, `POST /api/communities`, `GET/POST/PATCH /api/communities/[slug]`, `GET /api/communities/[slug]/moderators`, `GET /api/communities/[slug]/analytics`
- `GET /api/users/[username]`, `PATCH /api/users/me`, `GET /api/users/me/saved`, `GET /api/users/me/preferences`, `PUT /api/users/me/preferences`, `GET /api/users/[username]/followers`, `GET /api/users/[username]/following`, `GET /api/users/[username]/activity`, `POST /api/users/[username]/follow`
- `GET /api/search`, `GET /api/leaderboard`, `GET /api/notifications`, `POST /api/notifications/read-all`
- `GET /api/tags/trending`, `GET /api/tags/search`, `GET /api/tags/[name]`
- `POST /api/upload`, `GET /api/uploads/[file]`
- `GET /api/admin/stats`, `GET/PATCH/DELETE /api/admin/users`, `GET/DELETE /api/admin/communities`, `GET/DELETE /api/admin/posts`, `GET/DELETE /api/admin/comments`, `GET/PUT /api/admin/settings`

## Configurações de Admin

Aceder via menu de conta → "Painel de Admin" (apenas utilizadores com `role: 'admin'`).

Configurações disponíveis:
- Nome do site, slogan, descrição, mensagem de boas-vindas
- Toggles: permitir registos, publicações, comentários, verificação de email, modo de manutenção
- Limites: tamanho máximo do corpo de publicações e comentários
- Regras globais da comunidade

## Licença

Projeto de demonstração. Livre para uso educacional.

---

Feito com ❤️ para Angola 🇦🇴
