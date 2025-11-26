import { apiClient } from '../client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../types'

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data)
    return response.data
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data)
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout')
  },

  async me(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me')
    return response.data
  },
}
