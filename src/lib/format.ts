export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'agora mesmo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `há ${weeks} sem`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`
  const years = Math.floor(days / 365)
  return `há ${years} ano${years > 1 ? 's' : ''}`
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

export function formatKwanza(n: number): string {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(n) + ' Kz'
}

export function pluralize(n: number, singular: string, plural?: string) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural || singular + 's'}`
}

export function excerpt(text: string | null | undefined, max = 280): string {
  if (!text) return ''
  const clean = stripMarkdown(text)
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + '…'
}

export function stripMarkdown(text: string): string {
  return text
    // remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, ' ')
    // remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // remove bold/italic markers
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // remove headings
    .replace(/^#{1,3}\s+/gm, '')
    // remove blockquote markers
    .replace(/^\s*>\s?/gm, '')
    // remove list markers
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // remove links [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // remove horizontal rules
    .replace(/^\s*---+\s*$/gm, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}
