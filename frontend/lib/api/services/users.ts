import { apiClient } from '../client'
import type { User, Post, UpdateProfileRequest, PaginatedResponse, ActivityItem } from '../../types'
import { transformPaginatedResponse, type BackendPaginatedResponse } from '../utils'

export const usersService = {
  async getUser(username: string): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`/api/users/${username}`)
    return response.data.user
  },

  async updateProfile(username: string, data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.patch<{ user: User }>(`/api/users/${username}`, data)
    return response.data.user
  },

  async getUserPosts(username: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>(`/api/users/${username}/posts`, { params })
    return transformPaginatedResponse(response.data)
  },

  async getFollowers(username: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(`/api/users/${username}/followers`)
    return response.data.data
  },

  async getFollowing(username: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(`/api/users/${username}/following`)
    return response.data.data
  },

  async followUser(username: string): Promise<void> {
    await apiClient.post(`/api/users/${username}/follow`)
  },

  async unfollowUser(username: string): Promise<void> {
    await apiClient.delete(`/api/users/${username}/follow`)
  },

  async discoverUsers(params?: { artistsOnly?: boolean; newOnly?: boolean }): Promise<User[]> {
    const searchParams = new URLSearchParams()
    if (params?.artistsOnly) {
      searchParams.append('type', 'users')
    }
    // Use search API to discover users
    const response = await apiClient.get<{ users: User[] }>(`/api/search?q= &type=users`)
    return response.data.users || []
  },

  async getUserReviews(username: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<ActivityItem>> {
    const response = await apiClient.get<BackendPaginatedResponse<ActivityItem>>(`/api/users/${username}/reviews`, { params })
    return transformPaginatedResponse(response.data)
  },
}
