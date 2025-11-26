import { apiClient } from '../client'
import type { Post, PaginatedResponse } from '../../types'

export const feedService = {
  async getFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<PaginatedResponse<Post>>('/api/feed', { params })
    return response.data
  },

  async getFollowingFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<PaginatedResponse<Post>>('/api/feed/following', { params })
    return response.data
  },

  async getCommunitiesFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<PaginatedResponse<Post>>('/api/feed/communities', { params })
    return response.data
  },
}
