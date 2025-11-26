import { apiClient } from '../client'
import type { User, Post, UpdateProfileRequest, PaginatedResponse } from '../../types'

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
    const response = await apiClient.get<PaginatedResponse<Post>>(`/api/users/${username}/posts`, { params })
    return response.data
  },

  async getFollowers(username: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(`/api/users/${username}/followers`)
    return response.data
  },

  async getFollowing(username: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(`/api/users/${username}/following`)
    return response.data
  },

  async followUser(username: string): Promise<void> {
    await apiClient.post(`/api/users/${username}/follow`)
  },

  async unfollowUser(username: string): Promise<void> {
    await apiClient.delete(`/api/users/${username}/follow`)
  },
}
