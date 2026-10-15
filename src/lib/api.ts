'use client'

import type { SessionUser } from '@/lib/store'

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any)?.error || 'Erro de rede')
  }
  return data as T
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}

export type Community = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string
  color: string
  category: string
  members: number
  joined?: boolean
  createdAt: string
}

export type Author = {
  id: string
  username: string
  displayName: string | null
  avatarColor: string
  karma?: number
  location?: string | null
}

export type PostSummary = {
  id: string
  type: string
  title: string
  body: string | null
  link?: string | null
  image?: string | null
  score: number
  upvotes: number
  downvotes: number
  views: number
  answerCount: number
  commentCount: number
  createdAt: string
  author: Author
  community: Pick<Community, 'id' | 'slug' | 'name' | 'color' | 'icon'>
  userVote: number
  saved?: boolean
}

export type Comment = {
  id: string
  body: string
  image?: string | null
  score: number
  upvotes: number
  downvotes: number
  isAnswer: boolean
  edited: boolean
  createdAt: string
  updatedAt: string
  author: Author
  userVote: number
  replyCount: number
  replies: Comment[]
}

export type VoteResult = {
  userVote: number
  upvotes: number
  downvotes: number
  score: number
}

export type Notification = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export const fetcher = <T>(url: string) => api.get<T>(url)

export type { SessionUser }
