'use client'

import { avatarGradient, colorOf, iconOf, initials } from '@/lib/theme'
import { navigate } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Flame, HelpCircle, MessageSquare, Link as LinkIcon, Star } from 'lucide-react'

export function Avatar({
  name,
  color,
  size = 'md',
  className,
}: {
  name: string | null
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-2xl',
  }
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm ring-2 ring-white/40 dark:ring-white/10',
        avatarGradient(color),
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

export function CommunityIcon({
  icon,
  color,
  size = 'md',
  className,
}: {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const Icon = iconOf(icon)
  const sizes = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-16 w-16 text-2xl',
  }
  const c = colorOf(color)
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
        c.gradient,
        sizes[size],
        className
      )}
    >
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Icon className="h-1/2 w-1/2" />
    </div>
  )
}

export function KarmaBadge({ karma, className }: { karma: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        className
      )}
      title={`${karma} de karma`}
    >
      <Flame className="h-3 w-3" />
      {karma}
    </span>
  )
}

export function PostTypeBadge({ type }: { type: string }) {
  if (type === 'question') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
        <HelpCircle className="h-3 w-3" /> Pergunta
      </span>
    )
  }
  if (type === 'discussion') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
        <MessageSquare className="h-3 w-3" /> Discussão
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
      <LinkIcon className="h-3 w-3" /> Link
    </span>
  )
}

export function AnswerBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
      <Star className="h-3 w-3 fill-current" /> Melhor resposta
    </span>
  )
}

export function TagPill({ name }: { name: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        navigate({ name: 'tag', tag: name })
      }}
      className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      #{name}
    </button>
  )
}
