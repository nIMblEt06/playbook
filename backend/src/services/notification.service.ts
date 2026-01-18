import { prisma } from '../utils/prisma.js';
import type { PaginationInput } from '../schemas/user.schema.js';

export class NotificationService {
  async getNotifications(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    // Enrich post-related notifications with post author info
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // For post-related notifications, fetch the post author
        if (['upvote_post', 'comment', 'mention'].includes(notification.type) && notification.targetType === 'post') {
          const post = await prisma.post.findUnique({
            where: { id: notification.targetId },
            select: {
              id: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          });
          return {
            ...notification,
            post: post ? { id: post.id, author: post.author } : null,
          };
        }
        // For comment-related notifications (upvote_comment, reply), fetch the comment's post and author
        if (['upvote_comment', 'reply'].includes(notification.type) && notification.targetType === 'comment') {
          const comment = await prisma.comment.findUnique({
            where: { id: notification.targetId },
            select: {
              postId: true,
              post: {
                select: {
                  id: true,
                  author: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                    },
                  },
                },
              },
            },
          });
          return {
            ...notification,
            post: comment?.post ? { id: comment.post.id, author: comment.post.author } : null,
          };
        }
        return notification;
      })
    );

    return {
      data: enrichedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }
}

export const notificationService = new NotificationService();
