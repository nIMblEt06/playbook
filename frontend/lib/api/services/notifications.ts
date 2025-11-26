import { apiClient } from '../client'
import type { Notification } from '../../types'

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/api/notifications')
    return response.data
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/api/notifications/read-all')
  },
}
