import { apiClient } from '../client'

// Types for discover page
export interface DiscoverRelease {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverImageUrl: string | null
  releaseDate: string | null
}

export interface DiscoverAlbum {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverImageUrl: string | null
  releaseYear: number | null
  averageRating: number | null
}

export interface DiscoverReview {
  id: string
  rating: number | null
  title: string | null
  content: string | null
  upvoteCount: number
  commentCount: number
  hasUpvoted?: boolean
  createdAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    avatarType?: string
    pixelAvatarId?: number | null
  }
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverImageUrl: string | null
  } | null
}

export interface CommunityActivity {
  id: string
  type: 'post'
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  content: string
  linkUrl: string | null
  linkType: string | null
  community: {
    id: string
    slug: string
    name: string
  } | null
  createdAt: string
}

export interface HomepageData {
  newReleases: DiscoverRelease[]
  recentlyLogged: DiscoverAlbum[]
  popularReviews: DiscoverReview[]
  communityActivity: CommunityActivity[]
}

export interface Tag {
  id: string
  name: string
  slug: string
  category: 'genre' | 'mood' | 'era' | 'custom'
  isOfficial?: boolean
  useCount: number
}

export interface PaginatedReviewsResponse {
  items: DiscoverReview[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export const discoverService = {
  async getHomepageData(): Promise<HomepageData> {
    const response = await apiClient.get<HomepageData>('/api/discover')
    return response.data
  },

  async getNewReleases(limit: number = 20): Promise<{ releases: DiscoverRelease[] }> {
    const response = await apiClient.get<{ releases: DiscoverRelease[] }>('/api/discover/new-releases', {
      params: { limit },
    })
    return response.data
  },

  async getRecentlyLogged(limit: number = 20): Promise<{ albums: DiscoverAlbum[] }> {
    const response = await apiClient.get<{ albums: DiscoverAlbum[] }>('/api/discover/recently-logged', {
      params: { limit },
    })
    return response.data
  },

  async getPopularReviews(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<{ reviews: DiscoverReview[] }> {
    const response = await apiClient.get<{ reviews: DiscoverReview[] }>('/api/discover/popular-reviews', {
      params: { timeframe, limit },
    })
    return response.data
  },

  async getTrending(limit: number = 20): Promise<{ albums: DiscoverAlbum[] }> {
    const response = await apiClient.get<{ albums: DiscoverAlbum[] }>('/api/discover/trending', {
      params: { limit },
    })
    return response.data
  },

  async getFriendsActivity(limit: number = 10): Promise<{ activity: CommunityActivity[] }> {
    const response = await apiClient.get<{ activity: CommunityActivity[] }>('/api/discover/friends-activity', {
      params: { limit },
    })
    return response.data
  },

  async getCommunityActivity(limit: number = 10): Promise<{ activity: CommunityActivity[] }> {
    const response = await apiClient.get<{ activity: CommunityActivity[] }>('/api/discover/community-activity', {
      params: { limit },
    })
    return response.data
  },

  async getPopularTags(limit: number = 20): Promise<{ tags: Tag[] }> {
    const response = await apiClient.get<{ tags: Tag[] }>('/api/discover/popular-tags', {
      params: { limit },
    })
    return response.data
  },

  async getAllReviews(page: number = 1, limit: number = 20): Promise<PaginatedReviewsResponse> {
    const response = await apiClient.get<PaginatedReviewsResponse>('/api/discover/reviews', {
      params: { page, limit },
    })
    return response.data
  },
}
