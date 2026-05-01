import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STALENESS_DAYS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = ''): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefix + crypto.randomUUID()
  }
  return prefix + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function isoDate(d: Date | string = new Date()): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toISOString().slice(0, 10)
}

export function daysSince(dateStr: string | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr).getTime()
  if (Number.isNaN(d)) return null
  return Math.floor((Date.now() - d) / 86_400_000)
}

export function stalenessTone(days: number | null): 'none' | 'fresh' | 'warming' | 'cold' {
  if (days === null) return 'none'
  if (days < STALENESS_DAYS.fresh) return 'fresh'
  if (days < STALENESS_DAYS.warm) return 'warming'
  return 'cold'
}

export function stalenessClasses(tone: ReturnType<typeof stalenessTone>): string {
  switch (tone) {
    case 'fresh':   return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'warming': return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    case 'cold':    return 'bg-red-500/15 text-red-700 dark:text-red-300'
    default:        return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400'
  }
}

export function formatDate(dateStr: string | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, opts)
}

export function formatRelative(dateStr: string | undefined): string {
  const days = daysSince(dateStr)
  if (days === null) return '—'
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay())
  return x
}

export function weeksAgo(n: number): Date {
  const d = startOfWeek(new Date())
  d.setDate(d.getDate() - n * 7)
  return d
}

export function downloadFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
