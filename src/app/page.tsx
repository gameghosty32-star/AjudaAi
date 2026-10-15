'use client'

import { useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { useApp } from '@/lib/store'

export default function Home() {
  const setRoute = useApp((s) => s.setRoute)
  const route = useApp((s) => s.route)

  // Support deep links via query params (?post=ID, ?community=slug, ?user=name, ?q=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const postId = params.get('post')
    const community = params.get('community')
    const username = params.get('user')
    const q = params.get('q')
    if (postId) setRoute({ name: 'post', id: postId })
    else if (community) setRoute({ name: 'community', slug: community })
    else if (username) setRoute({ name: 'user', username })
    else if (q) setRoute({ name: 'search', q })
  }, [])

  // Sync route to URL hash for shareability (without reload)
  useEffect(() => {
    if (typeof window === 'undefined') return
    let suffix = ''
    if (route.name === 'post') suffix = `?post=${route.id}`
    else if (route.name === 'community') suffix = `?community=${route.slug}`
    else if (route.name === 'user') suffix = `?user=${route.username}`
    else if (route.name === 'search') suffix = `?q=${encodeURIComponent(route.q)}`
    const url = `${window.location.pathname}${suffix}`
    window.history.replaceState({}, '', url)
  }, [route, setRoute])

  return <AppShell />
}
