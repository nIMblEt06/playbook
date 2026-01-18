import { apiClient } from '../client'

// Types matching backend Spotify API responses
export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  track_number: number
  preview_url?: string | null
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
    release_date: string
  }
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  album_type: string
  total_tracks: number
  release_date: string
  artists: Array<{ id: string; name: string }>
  images: Array<{ url: string; height: number; width: number }>
  external_urls: { spotify: string }
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: { total: number }
  images: Array<{ url: string; height: number; width: number }>
  external_urls: { spotify: string }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  public: boolean
  collaborative: boolean
  images: Array<{ url: string; height: number | null; width: number | null }>
  tracks: {
    total: number
    href: string
  }
  owner: {
    id: string
    display_name: string | null
  }
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[]
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}

export interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export const spotifyService = {
  /**
   * Get current Spotify access token for Web Playback SDK
   */
  async getAccessToken(): Promise<string> {
    const response = await apiClient.get<{ access_token: string }>(
      '/api/auth/spotify/token'
    )
    return response.data.access_token
  },

  /**
   * Search for tracks on Spotify
   */
  async searchTracks(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResult<SpotifyTrack>> {
    const response = await apiClient.get<SearchResult<SpotifyTrack>>(
      '/api/spotify/search/tracks',
      { params: { q: query, page, limit } }
    )
    return response.data
  },

  /**
   * Search for albums on Spotify
   */
  async searchAlbums(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResult<SpotifyAlbum>> {
    const response = await apiClient.get<SearchResult<SpotifyAlbum>>(
      '/api/spotify/search/albums',
      { params: { q: query, page, limit } }
    )
    return response.data
  },

  /**
   * Search for artists on Spotify
   */
  async searchArtists(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResult<SpotifyArtist>> {
    const response = await apiClient.get<SearchResult<SpotifyArtist>>(
      '/api/spotify/search/artists',
      { params: { q: query, page, limit } }
    )
    return response.data
  },

  /**
   * Get tracks from a specific album
   */
  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const response = await apiClient.get<{ tracks: SpotifyTrack[] }>(
      `/api/spotify/albums/${albumId}/tracks`
    )
    return response.data.tracks
  },

  /**
   * Get a single track by ID
   */
  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const response = await apiClient.get<SpotifyTrack>(
      `/api/spotify/tracks/${trackId}`
    )
    return response.data
  },

  /**
   * Get a single album by ID
   */
  async getAlbum(albumId: string): Promise<SpotifyAlbum> {
    const response = await apiClient.get<SpotifyAlbum>(
      `/api/spotify/albums/${albumId}`
    )
    return response.data
  },

  /**
   * Helper to get the best cover image URL from images array
   */
  getCoverUrl(images: Array<{ url: string; height: number; width: number }>, preferredSize: 'small' | 'medium' | 'large' = 'medium'): string | undefined {
    if (!images || images.length === 0) return undefined

    // Sort by height descending
    const sorted = [...images].sort((a, b) => b.height - a.height)

    switch (preferredSize) {
      case 'large':
        return sorted[0]?.url
      case 'small':
        return sorted[sorted.length - 1]?.url
      case 'medium':
      default:
        // Return middle image or second largest
        return sorted[Math.floor(sorted.length / 2)]?.url || sorted[0]?.url
    }
  },

  /**
   * Helper to format track/album artists as a string
   */
  formatArtists(artists: Array<{ name: string }>): string {
    return artists.map((a) => a.name).join(', ')
  },

  /**
   * Helper to format duration from milliseconds
   */
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  },

  /**
   * Get current user's Spotify playlists
   */
  async getMyPlaylists(
    limit: number = 50,
    offset: number = 0
  ): Promise<SpotifyPlaylistsResponse> {
    const response = await apiClient.get<SpotifyPlaylistsResponse>(
      '/api/spotify/me/playlists',
      { params: { limit, offset } }
    )
    return response.data
  },
}
