import { apiClient } from '../client'
import type { Post, PaginatedResponse, ActivityItem } from '../../types'
import { transformPaginatedResponse, type BackendPaginatedResponse } from '../utils'

export const feedService = {
  async getFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>('/api/feed', { params })
    return transformPaginatedResponse(response.data)
  },

  async getFollowingFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>('/api/feed/following', { params })
    return transformPaginatedResponse(response.data)
  },

  async getCommunitiesFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>('/api/feed/communities', { params })
    return transformPaginatedResponse(response.data)
  },

  async getActivityFeed(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<ActivityItem>> {
    const response = await apiClient.get<BackendPaginatedResponse<ActivityItem>>('/api/feed/activity', { params })
    return transformPaginatedResponse(response.data)
  },
}
