/**
 * Format a date as a relative time string (e.g., "5 minutes ago")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSec < 60) {
    return 'just now'
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }
  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`
  }
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`
  }
  return `${diffYears}y ago`
}

/**
 * Format a number with commas (e.g., 1,000,000)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Format a rating number (0-5) as a display string
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular
  }
  return plural || `${singular}s`
}

/**
 * Format a date as a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
