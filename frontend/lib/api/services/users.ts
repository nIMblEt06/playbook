import { apiClient } from '../client'
import type { User, Post, UpdateProfileRequest, PaginatedResponse } from '../../types'
import { transformPaginatedResponse, type BackendPaginatedResponse } from '../utils'

export const usersService = {
  async getUser(username: string): Promise<User> {
    const response = await apiClient.get<User>(`/api/users/${username}`)
    return response.data
  },

  async updateProfile(username: string, data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.patch<User>(`/api/users/${username}`, data)
    return response.data
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
}
