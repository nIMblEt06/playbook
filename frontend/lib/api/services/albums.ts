import { apiClient } from '../client'

// Types for album page
export interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  artistId: string | null
  artistSpotifyId: string | null  // Artist's Spotify ID for linking to artist page
  releaseDate: string | null
  releaseYear: number | null
  coverImageUrl: string | null
  trackCount: number | null
  albumType: string
  reviewCount: number
  ratingSum: number
  ratingCount: number
  averageRating: number | null
  ratingDistribution: { [key: number]: number }
  userRating: number | null
  userReview: AlbumReview | null
  tags: AlbumTag[]
}

export interface AlbumTag {
  id: string
  name: string
  slug: string
  category: string
}

export interface AlbumTrack {
  id: string
  spotifyId: string
  title: string
  artistName: string
  position: number
  duration: number | null
  previewUrl: string | null  // 30-sec preview URL from Spotify (for free-tier playback)
  spotifyUri: string | null  // spotify:track:xxx (for premium playback)
}

export interface AlbumReview {
  id: string
  rating: number | null
  title: string | null
  content: string | null
  upvoteCount: number
  commentCount: number
  createdAt: string
  hasUpvoted?: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    avatarType?: string
    pixelAvatarId?: number | null
  }
}

export interface AlbumReviewsResponse {
  items: AlbumReview[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export const albumsService = {
  async getAlbum(spotifyId: string): Promise<{ album: Album }> {
    const response = await apiClient.get<{ album: Album }>(`/api/albums/${spotifyId}`)
    return response.data
  },

  async getAlbumTracks(spotifyId: string): Promise<{ tracks: AlbumTrack[] }> {
    const response = await apiClient.get<{ tracks: AlbumTrack[] }>(`/api/albums/${spotifyId}/tracks`)
    return response.data
  },

  async getAlbumReviews(
    spotifyId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ): Promise<AlbumReviewsResponse> {
    const response = await apiClient.get<AlbumReviewsResponse>(`/api/albums/${spotifyId}/reviews`, {
      params,
    })
    return response.data
  },

  async createOrUpdateReview(
    spotifyId: string,
    data: { rating?: number; title?: string; content?: string }
  ): Promise<{ review: AlbumReview }> {
    const response = await apiClient.post<{ review: AlbumReview }>(`/api/albums/${spotifyId}/reviews`, data)
    return response.data
  },

  async rateAlbum(spotifyId: string, rating: number): Promise<void> {
    await apiClient.post(`/api/albums/${spotifyId}/rate`, { value: rating })
  },

  async removeRating(spotifyId: string): Promise<void> {
    await apiClient.delete(`/api/albums/${spotifyId}/rate`)
  },

  async searchAlbums(query: string, limit: number = 10): Promise<{ albums: AlbumSearchResult[] }> {
    const response = await apiClient.get<{ albums: AlbumSearchResult[] }>('/api/albums/search', {
      params: { q: query, limit },
    })
    return response.data
  },
}

// Search result type
export interface AlbumSearchResult {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  releaseYear: number | null
  albumType: string
}
