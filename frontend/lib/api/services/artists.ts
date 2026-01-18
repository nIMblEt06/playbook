import { apiClient } from '../client'
import type { AlbumReview } from './albums'

// Types for artist page
export interface ArtistTag {
  id: string
  name: string
  slug: string
}

export interface Artist {
  id: string
  spotifyId: string
  name: string
  sortName: string | null
  imageUrl: string | null
  country: string | null
  type: string | null
  reviewCount: number
  ratingSum: number
  ratingCount: number
  averageRating: number | null
  albumCount: number
  // Metadata (optional, from JSON metadata field)
  metadata?: {
    'life-span'?: {
      begin?: string
      end?: string
      ended?: boolean
    }
    tags?: Array<{ name: string; count?: number }>
  }
}

export interface ArtistAlbum {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverImageUrl: string | null
  releaseYear: number | null
  albumType: string
  reviewCount: number
  ratingSum: number
  ratingCount: number
}

export interface ReleaseGroup {
  id: string
  title: string
  'primary-type': string
  'secondary-types'?: string[]
  'first-release-date'?: string
  coverArtUrl?: string | null
}

export interface ArtistDiscographyResponse {
  items: ReleaseGroup[]
  total: number
  offset: number
}

export interface ArtistAlbumsResponse {
  items: ArtistAlbum[]
  total: number
  page: number
  limit: number
}

export interface ArtistReviewsResponse {
  items: AlbumReview[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export const artistsService = {
  async getArtist(spotifyId: string): Promise<{ artist: Artist }> {
    const response = await apiClient.get<{ artist: Artist }>(`/api/artists/${spotifyId}`)
    return response.data
  },

  async getArtistAlbums(
    spotifyId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ArtistAlbumsResponse> {
    const response = await apiClient.get<ArtistAlbumsResponse>(`/api/artists/${spotifyId}/albums`, {
      params,
    })
    return response.data
  },

  async getArtistDiscography(
    spotifyId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ArtistDiscographyResponse> {
    const response = await apiClient.get<ArtistDiscographyResponse>(`/api/artists/${spotifyId}/discography`, {
      params,
    })
    return response.data
  },

  async getArtistReviews(
    spotifyId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ): Promise<ArtistReviewsResponse> {
    const response = await apiClient.get<ArtistReviewsResponse>(`/api/artists/${spotifyId}/reviews`, {
      params,
    })
    return response.data
  },

  async searchArtists(query: string, limit: number = 10): Promise<{ artists: Artist[] }> {
    const response = await apiClient.get<{ artists: Artist[] }>('/api/artists/search', {
      params: { q: query, limit },
    })
    return response.data
  },
}
