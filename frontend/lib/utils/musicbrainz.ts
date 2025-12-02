const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const COVERART_API_BASE = 'https://coverartarchive.org'
const USER_AGENT = 'Playbook/1.0.0'

// Rate limiting: MusicBrainz allows 1 request per second
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  
  lastRequestTime = Date.now()
  
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  })
}

export interface ArtistCredit {
  artist: {
    id: string
    name: string
  }
}

export interface Release {
  id: string
  title: string
  'artist-credit': ArtistCredit[]
  date?: string
  'release-group'?: {
    id: string
    'primary-type'?: string
  }
  media?: Medium[]
}

export interface Medium {
  position: number
  format?: string
  'track-count': number
  tracks?: Track[]
}

export interface Track {
  id: string
  number: string
  title: string
  length?: number
  recording?: Recording
}

export interface Recording {
  id: string
  title: string
  length?: number
  'artist-credit': ArtistCredit[]
  releases?: Release[]
}

interface SearchResponse<T> {
  items: T[]
  total: number
  offset: number
}

/**
 * Search for tracks on MusicBrainz with optimized query
 */
export async function searchTracks(
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<SearchResponse<Recording>> {
  const offset = (page - 1) * limit
  
  // Build optimized search query
  // Search in recording (track name), artist, and release fields for best results
  const searchQuery = query.trim()
  
  const params = new URLSearchParams({
    query: searchQuery,
    fmt: 'json',
    limit: Math.min(limit, 100).toString(), // API max is 100
    offset: offset.toString(),
  })
  
  const url = `${MUSICBRAINZ_API_BASE}/recording?${params.toString()}`
  
  try {
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      items: data.recordings || [],
      total: data.count || 0,
      offset: data.offset || 0,
    }
  } catch (error) {
    console.error('Error searching tracks:', error)
    return { items: [], total: 0, offset: 0 }
  }
}

/**
 * Search for albums (releases) on MusicBrainz with optimized query
 * Filters for official releases and albums only
 */
export async function searchAlbums(
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<SearchResponse<Release>> {
  const offset = (page - 1) * limit
  
  // Build optimized search query
  // Search for albums with status:official to get quality results
  // primarytype:album to exclude singles, EPs, etc.
  const searchQuery = query.trim()
  const enhancedQuery = `${searchQuery} AND status:official AND primarytype:album`
  
  const params = new URLSearchParams({
    query: enhancedQuery,
    fmt: 'json',
    limit: Math.min(limit, 100).toString(), // API max is 100
    offset: offset.toString(),
  })
  
  const url = `${MUSICBRAINZ_API_BASE}/release?${params.toString()}`
  
  try {
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      items: data.releases || [],
      total: data.count || 0,
      offset: data.offset || 0,
    }
  } catch (error) {
    console.error('Error searching albums:', error)
    return { items: [], total: 0, offset: 0 }
  }
}

/**
 * Get tracks from a release/album
 */
export async function getAlbumTracks(releaseId: string): Promise<Track[]> {
  const params = new URLSearchParams({
    fmt: 'json',
    inc: 'recordings', // Include recording information
  })
  
  const url = `${MUSICBRAINZ_API_BASE}/release/${releaseId}?${params.toString()}`
  
  try {
    const response = await rateLimitedFetch(url)
    
    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract all tracks from all media (discs)
    const allTracks: Track[] = []
    
    if (data.media && Array.isArray(data.media)) {
      for (const medium of data.media) {
        if (medium.tracks && Array.isArray(medium.tracks)) {
          allTracks.push(...medium.tracks)
        }
      }
    }
    
    return allTracks
  } catch (error) {
    console.error('Error fetching album tracks:', error)
    return []
  }
}

/**
 * Get cover art URL for a release
 */
export async function getCoverArt(releaseId: string): Promise<string | null> {
  const url = `${COVERART_API_BASE}/release/${releaseId}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    // Try to get the front cover, or fall back to the first image
    const frontCover = data.images?.find((img: any) => 
      img.front === true || img.types?.includes('Front')
    )
    
    if (frontCover?.thumbnails?.small) {
      return frontCover.thumbnails.small
    }
    
    if (frontCover?.image) {
      return frontCover.image
    }
    
    // Fall back to first image
    if (data.images?.[0]?.thumbnails?.small) {
      return data.images[0].thumbnails.small
    }
    
    if (data.images?.[0]?.image) {
      return data.images[0].image
    }
    
    return null
  } catch (error) {
    console.error('Error fetching cover art:', error)
    return null
  }
}

