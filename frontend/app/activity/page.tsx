'use client'

import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { AppLayout } from '@/components/layout/app-layout'
import { ActivityCard } from '@/components/activity/activity-card'
import { useInfiniteActivityFeed } from '@/lib/hooks/use-activity'
import { useAuthStore } from '@/lib/store/auth-store'
import { Loader2, Activity, Users } from 'lucide-react'
import Link from 'next/link'

export default function ActivityPage() {
  const { user } = useAuthStore()
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteActivityFeed(20)

  // Fetch next page when scroll reaches bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten all pages of activity items
  const activityItems = data?.pages.flatMap((page) => page.items) ?? []

  // Not logged in state
  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <div className="px-4 md:px-6 py-6 border-b border-border">
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-muted-foreground mt-1">
              See what people you follow are listening to
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-16 px-4 md:px-6 text-center">
            <Activity className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to see activity</h2>
            <p className="text-muted-foreground mb-6">
              Log in to see ratings and reviews from people you follow
            </p>
            <Link
              href="/auth/login"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="px-6 py-6 border-b border-border">
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-muted-foreground mt-1">
            See what people you follow are listening to
          </p>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Something went wrong. Please try again.</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && activityItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No activity yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Follow people to see their ratings and reviews in your activity feed
              </p>
              <Link
                href="/discover"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Find People to Follow
              </Link>
            </div>
          )}

          {/* Activity list */}
          {activityItems.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              {activityItems.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}

              {/* Infinite scroll trigger */}
              <div ref={ref} className="h-1" />

              {/* Loading more */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {/* No more items */}
              {!hasNextPage && activityItems.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  You&apos;ve reached the end
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
