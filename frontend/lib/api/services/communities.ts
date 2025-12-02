import { apiClient } from '../client'
import type { Community, CreateCommunityRequest, Post, PaginatedResponse } from '../../types'
import { transformPaginatedResponse, type BackendPaginatedResponse } from '../utils'

export const communitiesService = {
  async getCommunities(params?: { type?: 'artist' | 'user'; page?: number; limit?: number }): Promise<PaginatedResponse<Community>> {
    const response = await apiClient.get<BackendPaginatedResponse<Community>>('/api/communities', { params })
    return transformPaginatedResponse(response.data)
  },

  async getCommunity(slug: string): Promise<Community> {
    const response = await apiClient.get<Community>(`/api/communities/${slug}`)
    return response.data
  },

  async createCommunity(data: CreateCommunityRequest): Promise<Community> {
    const response = await apiClient.post<Community>('/api/communities', data)
    return response.data
  },

  async updateCommunity(slug: string, data: Partial<CreateCommunityRequest>): Promise<Community> {
    const response = await apiClient.patch<Community>(`/api/communities/${slug}`, data)
    return response.data
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
