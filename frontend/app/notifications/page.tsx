'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth } from '@/components/auth/require-auth'
import { notificationsService } from '@/lib/api/services/notifications'
import type { Notification } from '@/lib/types'
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  Loader2,
  AtSign,
  MessageSquare,
} from 'lucide-react'

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  )
}

function NotificationsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }

    // Navigate to relevant content
    switch (notification.type) {
      case 'follow':
        router.push(`/profile/${notification.actor.username}`)
        break
      case 'comment':
      case 'reply':
        // For comment notifications, navigate to post with comments expanded
        if (notification.post?.author) {
          router.push(`/profile/${notification.post.author.username}?post=${notification.post.id}&showComments=true`)
        } else {
          router.push(`/profile/${notification.actor.username}`)
        }
        break
      case 'upvote_post':
      case 'upvote_comment':
      case 'mention':
        // For other post-related notifications, navigate to the post author's profile
        // with a query param to highlight/scroll to the specific post
        if (notification.post?.author) {
          router.push(`/profile/${notification.post.author.username}?post=${notification.post.id}`)
        } else {
          // Fallback to actor's profile if post info is not available
          router.push(`/profile/${notification.actor.username}`)
        }
        break
      default:
        break
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />
      case 'upvote_post':
      case 'upvote_comment':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-purple-500" />
      case 'mention':
        return <AtSign className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationMessage = (notification: Notification) => {
    const actorName = notification.actor.displayName || notification.actor.username

    switch (notification.type) {
      case 'follow':
        return (
          <>
            <span className="font-semibold">{actorName}</span> followed you
          </>
        )
      case 'upvote_post':
        return (
          <>
            <span className="font-semibold">{actorName}</span> upvoted your post
          </>
        )
      case 'upvote_comment':
        return (
          <>
            <span className="font-semibold">{actorName}</span> upvoted your comment
          </>
        )
      case 'comment':
        return (
          <>
            <span className="font-semibold">{actorName}</span> commented on your post
          </>
        )
      case 'reply':
        return (
          <>
            <span className="font-semibold">{actorName}</span> replied to your comment
          </>
        )
      case 'mention':
        return (
          <>
            <span className="font-semibold">{actorName}</span> mentioned you
          </>
        )
      default:
        return (
          <>
            <span className="font-semibold">{actorName}</span> interacted with you
          </>
        )
    }
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 px-4 md:px-6 py-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {notifications && notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="px-4 md:px-6 py-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-destructive mb-4">Failed to load notifications</p>
            <button onClick={() => refetch()} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && notifications && notifications.length === 0 && (
          <div className="px-4 md:px-6 py-16 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground px-4">
              When someone follows you, upvotes your posts, or comments, you&apos;ll see it here
            </p>
          </div>
        )}

        {/* Notifications list */}
        {!isLoading && !error && notifications && notifications.length > 0 && (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 md:px-6 py-4 cursor-pointer transition-all hover:bg-accent/50 active:bg-accent min-h-[72px] ${
                  !notification.isRead ? 'bg-accent/20' : 'opacity-75'
                }`}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Actor Avatar */}
                  <div className="flex-shrink-0">
                    {notification.actor.avatarUrl ? (
                      <img
                        src={notification.actor.avatarUrl}
                        alt={notification.actor.displayName}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                        {notification.actor.displayName[0]?.toUpperCase() ||
                          notification.actor.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm md:text-base leading-relaxed">
                        {getNotificationMessage(notification)}
                      </p>
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
