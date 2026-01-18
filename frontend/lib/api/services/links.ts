import { apiClient } from '../client'

export interface ParsedLink {
  type: 'spotify' | 'apple' | 'youtube' | 'soundcloud' | 'unknown'
  contentType: 'track' | 'album' | 'playlist' | 'artist' | 'unknown'
  url: string
  id?: string
}

export interface LinkMetadata {
  parsed: ParsedLink
  title?: string
  artist?: string
  albumName?: string
  imageUrl?: string
  platform?: string
  embedUrl?: string
}

export const linksService = {
  async parseUrl(url: string): Promise<ParsedLink> {
    const response = await apiClient.post<ParsedLink>('/api/links/parse', { url })
    return response.data
  },

  async getMetadata(url: string): Promise<LinkMetadata> {
    const response = await apiClient.post<LinkMetadata>('/api/links/metadata', { url })
    return response.data
  },
}

// URL detection regex for common music platforms
const URL_REGEX = /(https?:\/\/[^\s]+)/gi

const MUSIC_PLATFORM_PATTERNS = [
  /open\.spotify\.com/i,
  /spotify\.link/i,
  /music\.apple\.com/i,
  /youtube\.com\/watch/i,
  /youtu\.be\//i,
  /soundcloud\.com/i,
  /tidal\.com/i,
  /deezer\.com/i,
  /bandcamp\.com/i,
]

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX)
  return matches || []
}

/**
 * Check if a URL is from a music platform
 */
export function isMusicPlatformUrl(url: string): boolean {
  return MUSIC_PLATFORM_PATTERNS.some((pattern) => pattern.test(url))
}

/**
 * Extract the first music platform URL from text
 */
export function extractFirstMusicUrl(text: string): string | null {
  const urls = extractUrls(text)
  return urls.find(isMusicPlatformUrl) || null
}

/**
 * Determine content type from parsed URL
 */
export function getContentTypeLabel(parsed: ParsedLink): string {
  switch (parsed.contentType) {
    case 'track':
      return 'Track'
    case 'album':
      return 'Album'
    case 'playlist':
      return 'Playlist'
    case 'artist':
      return 'Artist'
    default:
      return 'Link'
  }
}

/**
 * Get platform display name
 */
export function getPlatformName(type: ParsedLink['type']): string {
  switch (type) {
    case 'spotify':
      return 'Spotify'
    case 'apple':
      return 'Apple Music'
    case 'youtube':
      return 'YouTube'
    case 'soundcloud':
      return 'SoundCloud'
    default:
      return 'Music Link'
  }
}
