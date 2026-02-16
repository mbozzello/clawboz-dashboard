import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  return `${Math.floor(seconds / 2592000)}mo ago`
}

export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase()

  if (statusLower === 'done' || statusLower === 'completed' || statusLower === 'success') {
    return 'bg-green-100 text-green-800 border-green-200'
  }
  if (statusLower === 'error' || statusLower === 'failed') {
    return 'bg-red-100 text-red-800 border-red-200'
  }
  if (statusLower === 'started' || statusLower === 'in_progress' || statusLower === 'running') {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }
  return 'bg-gray-100 text-gray-800 border-gray-200'
}
