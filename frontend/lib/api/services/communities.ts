import { apiClient } from '../client'
import type { Community, CreateCommunityRequest, Post, PaginatedResponse } from '../../types'
import { transformPaginatedResponse, type BackendPaginatedResponse } from '../utils'

export const communitiesService = {
  async getCommunities(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Community>> {
    const response = await apiClient.get<BackendPaginatedResponse<Community>>('/api/communities', { params })
    return transformPaginatedResponse(response.data)
  },

  async getCommunity(slug: string): Promise<Community> {
    const response = await apiClient.get<{ community: Community }>(`/api/communities/${slug}`)
    return response.data.community
  },

  async createCommunity(data: CreateCommunityRequest): Promise<Community> {
    const response = await apiClient.post<{ community: Community }>('/api/communities', data)
    return response.data.community
  },

  async updateCommunity(slug: string, data: Partial<CreateCommunityRequest>): Promise<Community> {
    const response = await apiClient.patch<{ community: Community }>(`/api/communities/${slug}`, data)
    return response.data.community
  },

  async getCommunityPosts(slug: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>(`/api/communities/${slug}/posts`, { params })
    return transformPaginatedResponse(response.data)
  },

  async joinCommunity(slug: string): Promise<void> {
    await apiClient.post(`/api/communities/${slug}/join`)
  },

  async leaveCommunity(slug: string): Promise<void> {
    await apiClient.delete(`/api/communities/${slug}/leave`)
  },
}
