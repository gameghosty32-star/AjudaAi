import {
  Building2, Waves, Wheat, Mountain, Fuel, Sun, Droplets, Coffee, Landmark, Trees,
  GraduationCap, Cpu, HeartPulse, Briefcase, TrendingUp, Scale, Music, Trophy,
  Plane, Sprout, MessageCircle, type LucideIcon,
} from 'lucide-react'

// Complete color mapping with explicit Tailwind classes (so they aren't purged)
export type ColorKey =
  | 'rose' | 'amber' | 'emerald' | 'orange' | 'fuchsia' | 'cyan'
  | 'red' | 'lime' | 'blue' | 'violet' | 'green' | 'yellow'

export const COLOR_CLASSES: Record<ColorKey, {
  bg: string
  bgSoft: string
  text: string
  textStrong: string
  border: string
  ring: string
  gradient: string
  dot: string
}> = {
  rose:    { bg: 'bg-rose-500',    bgSoft: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-300',    textStrong: 'text-rose-600',    border: 'border-rose-200 dark:border-rose-900',    ring: 'ring-rose-500/30',    gradient: 'from-rose-500 to-rose-700',    dot: 'bg-rose-500' },
  amber:   { bg: 'bg-amber-500',   bgSoft: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-700 dark:text-amber-300',   textStrong: 'text-amber-600',   border: 'border-amber-200 dark:border-amber-900',   ring: 'ring-amber-500/30',   gradient: 'from-amber-500 to-amber-700',   dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-500', bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', textStrong: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-900', ring: 'ring-emerald-500/30', gradient: 'from-emerald-500 to-emerald-700', dot: 'bg-emerald-500' },
  orange:  { bg: 'bg-orange-500',  bgSoft: 'bg-orange-50 dark:bg-orange-950/40',  text: 'text-orange-700 dark:text-orange-300',  textStrong: 'text-orange-600',  border: 'border-orange-200 dark:border-orange-900',  ring: 'ring-orange-500/30',  gradient: 'from-orange-500 to-orange-700',  dot: 'bg-orange-500' },
  fuchsia: { bg: 'bg-fuchsia-500', bgSoft: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', text: 'text-fuchsia-700 dark:text-fuchsia-300', textStrong: 'text-fuchsia-600', border: 'border-fuchsia-200 dark:border-fuchsia-900', ring: 'ring-fuchsia-500/30', gradient: 'from-fuchsia-500 to-fuchsia-700', dot: 'bg-fuchsia-500' },
  cyan:    { bg: 'bg-cyan-500',    bgSoft: 'bg-cyan-50 dark:bg-cyan-950/40',    text: 'text-cyan-700 dark:text-cyan-300',    textStrong: 'text-cyan-600',    border: 'border-cyan-200 dark:border-cyan-900',    ring: 'ring-cyan-500/30',    gradient: 'from-cyan-500 to-cyan-700',    dot: 'bg-cyan-500' },
  red:     { bg: 'bg-red-500',     bgSoft: 'bg-red-50 dark:bg-red-950/40',     text: 'text-red-700 dark:text-red-300',     textStrong: 'text-red-600',     border: 'border-red-200 dark:border-red-900',     ring: 'ring-red-500/30',     gradient: 'from-red-500 to-red-700',     dot: 'bg-red-500' },
  lime:    { bg: 'bg-lime-500',    bgSoft: 'bg-lime-50 dark:bg-lime-950/40',    text: 'text-lime-700 dark:text-lime-300',    textStrong: 'text-lime-600',    border: 'border-lime-200 dark:border-lime-900',    ring: 'ring-lime-500/30',    gradient: 'from-lime-500 to-lime-700',    dot: 'bg-lime-500' },
  blue:    { bg: 'bg-blue-500',    bgSoft: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-700 dark:text-blue-300',    textStrong: 'text-blue-600',    border: 'border-blue-200 dark:border-blue-900',    ring: 'ring-blue-500/30',    gradient: 'from-blue-500 to-blue-700',    dot: 'bg-blue-500' },
  violet:  { bg: 'bg-violet-500',  bgSoft: 'bg-violet-50 dark:bg-violet-950/40',  text: 'text-violet-700 dark:text-violet-300',  textStrong: 'text-violet-600',  border: 'border-violet-200 dark:border-violet-900',  ring: 'ring-violet-500/30',  gradient: 'from-violet-500 to-violet-700',  dot: 'bg-violet-500' },
  green:   { bg: 'bg-green-500',   bgSoft: 'bg-green-50 dark:bg-green-950/40',   text: 'text-green-700 dark:text-green-300',   textStrong: 'text-green-600',   border: 'border-green-200 dark:border-green-900',   ring: 'ring-green-500/30',   gradient: 'from-green-500 to-green-700',   dot: 'bg-green-500' },
  yellow:  { bg: 'bg-yellow-500',  bgSoft: 'bg-yellow-50 dark:bg-yellow-950/40',  text: 'text-yellow-700 dark:text-yellow-300',  textStrong: 'text-yellow-600',  border: 'border-yellow-200 dark:border-yellow-900',  ring: 'ring-yellow-500/30',  gradient: 'from-yellow-500 to-yellow-700',  dot: 'bg-yellow-500' },
}

export function colorOf(color: string): typeof COLOR_CLASSES[ColorKey] {
  return (COLOR_CLASSES as Record<string, typeof COLOR_CLASSES[ColorKey]>)[color] || COLOR_CLASSES.rose
}

const ICONS: Record<string, LucideIcon> = {
  'building-2': Building2,
  waves: Waves,
  wheat: Wheat,
  mountain: Mountain,
  fuel: Fuel,
  sun: Sun,
  droplets: Droplets,
  coffee: Coffee,
  landmark: Landmark,
  trees: Trees,
  'graduation-cap': GraduationCap,
  cpu: Cpu,
  'heart-pulse': HeartPulse,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  scale: Scale,
  music: Music,
  trophy: Trophy,
  plane: Plane,
  sprout: Sprout,
  'message-circle': MessageCircle,
}

export function iconOf(name: string): LucideIcon {
  return ICONS[name] || MessageCircle
}

// Avatar color mapping for users (uses gradient backgrounds)
export const AVATAR_GRADIENTS: Record<string, string> = {
  rose: 'from-rose-500 to-rose-700',
  amber: 'from-amber-500 to-orange-600',
  emerald: 'from-emerald-500 to-teal-700',
  orange: 'from-orange-500 to-red-600',
  fuchsia: 'from-fuchsia-500 to-pink-700',
  cyan: 'from-cyan-500 to-blue-600',
  red: 'from-red-500 to-rose-700',
  lime: 'from-lime-500 to-green-600',
  blue: 'from-blue-500 to-indigo-600',
  violet: 'from-violet-500 to-purple-700',
  green: 'from-green-500 to-emerald-700',
  yellow: 'from-yellow-500 to-amber-600',
}

export function avatarGradient(color: string): string {
  return AVATAR_GRADIENTS[color] || AVATAR_GRADIENTS.rose
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
