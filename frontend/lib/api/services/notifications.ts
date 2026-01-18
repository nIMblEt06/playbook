import { apiClient } from '../client'
import type { Notification } from '../../types'

interface NotificationsResponse {
  data: Notification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<NotificationsResponse>('/api/notifications')
    return response.data.data
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/api/notifications/read-all')
  },
}
