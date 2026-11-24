import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatIndonesianDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  if (isToday) {
    return `Hari ini, ${timeStr}`
  }
  if (isYesterday) {
    return `Kemarin, ${timeStr}`
  }

  const day = date.getDate()
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des'
  ]
  const monthStr = months[date.getMonth()]
  const yearStr = date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : ''

  return `${day} ${monthStr}${yearStr}, ${timeStr}`
}

export function extractPreview(content: string): string {
  if (!content) return 'Catatan kosong...'
  // Strip markdown formatting for preview
  const plain = content
    .replace(/^#+\s+/gm, '') // Remove heading tags
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '[Gambar]') // Replace images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Replace links
    .replace(/- \[[ xX]\]\s*/g, '') // Checkboxes
    .trim()

  return plain || 'Catatan kosong...'
}
