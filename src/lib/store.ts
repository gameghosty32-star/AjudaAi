'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SessionUser = {
  id: string
  username: string
  displayName: string | null
  email: string
  avatarColor: string
  karma: number
  role: string
  location: string | null
}

export type Route =
  | { name: 'home' }
  | { name: 'community'; slug: string }
  | { name: 'communities' }
  | { name: 'post'; id: string }
  | { name: 'composer'; communitySlug?: string }
  | { name: 'user'; username: string }
  | { name: 'search'; q: string }
  | { name: 'notifications' }
  | { name: 'leaderboard' }
  | { name: 'tag'; tag: string }
  | { name: 'settings' }
  | { name: 'admin' }

type AppState = {
  route: Route
  sort: 'hot' | 'new' | 'top' | 'rising'
  user: SessionUser | null
  authOpen: boolean
  authMode: 'login' | 'register'
  composerOpen: boolean
  composerCommunity: string | undefined
  sidebarOpen: boolean
  setRoute: (r: Route) => void
  setSort: (s: AppState['sort']) => void
  setUser: (u: SessionUser | null) => void
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  openComposer: (communitySlug?: string) => void
  closeComposer: () => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      route: { name: 'home' },
      sort: 'hot',
      user: null,
      authOpen: false,
      authMode: 'login',
      composerOpen: false,
      composerCommunity: undefined,
      sidebarOpen: false,
      setRoute: (route) => {
        set({ route, sidebarOpen: false })
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
      },
      setSort: (sort) => set({ sort }),
      setUser: (user) => set({ user }),
      openAuth: (authMode = 'login') => set({ authOpen: true, authMode }),
      closeAuth: () => set({ authOpen: false }),
      openComposer: (composerCommunity) => set({ composerOpen: true, composerCommunity }),
      closeComposer: () => set({ composerOpen: false, composerCommunity: undefined }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'ajudai-app',
      partialize: (s) => ({ sort: s.sort }) as any,
    }
  )
)

export function navigate(route: Route) {
  useApp.getState().setRoute(route)
}
