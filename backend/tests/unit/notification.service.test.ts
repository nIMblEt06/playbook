import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { notificationService } from '../../src/services/notification.service.js';
import { mockUsers } from '../fixtures/index.js';

const mockNotifications = {
  followNotification: {
    id: 'notif-1',
    userId: mockUsers.user1.id,
    type: 'follow' as const,
    actorId: mockUsers.user2.id,
    targetType: 'user',
    targetId: mockUsers.user1.id,
    isRead: false,
    createdAt: new Date('2024-01-15'),
    actor: {
      id: mockUsers.user2.id,
      username: mockUsers.user2.username,
      displayName: mockUsers.user2.displayName,
      avatarUrl: mockUsers.user2.avatarUrl,
    },
  },
  upvoteNotification: {
    id: 'notif-2',
    userId: mockUsers.user1.id,
    type: 'upvote_post' as const,
    actorId: mockUsers.user2.id,
    targetType: 'post',
    targetId: 'post-1',
    isRead: true,
    createdAt: new Date('2024-01-14'),
    actor: {
      id: mockUsers.user2.id,
      username: mockUsers.user2.username,
      displayName: mockUsers.user2.displayName,
      avatarUrl: mockUsers.user2.avatarUrl,
    },
  },
};

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return paginated notifications with unread count', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        mockNotifications.followNotification,
        mockNotifications.upvoteNotification,
      ] as any);
      vi.mocked(prisma.notification.count)
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1); // unread

      const result = await notificationService.getNotifications(mockUsers.user1.id, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
      expect(result.pagination.total).toBe(2);
    });

    it('should include actor information', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([
        mockNotifications.followNotification,
      ] as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      const result = await notificationService.getNotifications(mockUsers.user1.id, {
        page: 1,
        limit: 20,
      });

      expect(result.data[0].actor.username).toBe(mockUsers.user2.username);
    });

    it('should paginate correctly', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(50);

      const result = await notificationService.getNotifications(mockUsers.user1.id, {
        page: 3,
        limit: 10,
      });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.totalPages).toBe(5);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(
        mockNotifications.followNotification as any
      );
      vi.mocked(prisma.notification.update).mockResolvedValue({
        ...mockNotifications.followNotification,
        isRead: true,
      } as any);

      const result = await notificationService.markAsRead(
        mockNotifications.followNotification.id,
        mockUsers.user1.id
      );

      expect(result.success).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotifications.followNotification.id },
        data: { isRead: true },
      });
    });

    it('should throw error for non-existent notification', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);

      await expect(
        notificationService.markAsRead('non-existent', mockUsers.user1.id)
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error for unauthorized user', async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue(
        mockNotifications.followNotification as any
      );

      await expect(
        notificationService.markAsRead(
          mockNotifications.followNotification.id,
          mockUsers.user2.id // Not the recipient
        )
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 } as any);

      const result = await notificationService.markAllAsRead(mockUsers.user1.id);

      expect(result.success).toBe(true);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUsers.user1.id, isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(5);

      const result = await notificationService.getUnreadCount(mockUsers.user1.id);

      expect(result.count).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: mockUsers.user1.id, isRead: false },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      const result = await notificationService.getUnreadCount(mockUsers.user1.id);

      expect(result.count).toBe(0);
    });
  });
});
