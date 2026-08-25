import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({})

export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs))
}

/**
 * Formate un timestamp en millisecondes au format MM:SS.mmm
 */
export function formatTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const millis = Math.floor(ms % 1000)

  const pad = (n: number, size = 2) => String(n).padStart(size, '0')
  return `${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`
}

/**
 * Génère un identifiant unique compact
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
}
