'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PostComposer } from '@/components/posts/post-composer'
import { PostCard } from '@/components/posts/post-card'
import { useFeed, useFollowingFeed, useCommunitiesFeed } from '@/lib/hooks/use-feed'
import { useAuthStore } from '@/lib/store/auth-store'
import { useUIStore } from '@/lib/store/ui-store'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { currentFeedFilter } = useUIStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Select appropriate feed based on filter
  const allFeed = useFeed()
  const followingFeed = useFollowingFeed()
  const communitiesFeed = useCommunitiesFeed()

  const activeFeed =
    currentFeedFilter === 'following'
      ? followingFeed
      : currentFeedFilter === 'communities'
      ? communitiesFeed
      : allFeed

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = activeFeed

  const posts = data?.pages.flatMap((page) => page.items) || []

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout>
      <div>
        {/* Post Composer */}
        <PostComposer />

        {/* Feed */}
        <div>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="px-6 py-12 text-center">
              <p className="text-destructive">Failed to load feed</p>
              <button
                onClick={() => activeFeed.refetch()}
                className="mt-4 btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && posts.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {currentFeedFilter === 'following'
                  ? 'Follow some users to see their posts here'
                  : currentFeedFilter === 'communities'
                  ? 'Join some communities to see posts here'
                  : 'No posts yet. Start following users or join communities!'}
              </p>
              {currentFeedFilter === 'following' && (
                <button
                  onClick={() => router.push('/discover')}
                  className="btn-primary"
                >
                  Discover Users
                </button>
              )}
              {currentFeedFilter === 'communities' && (
                <button
                  onClick={() => router.push('/communities')}
                  className="btn-primary"
                >
                  Browse Communities
                </button>
              )}
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Load More */}
          {hasNextPage && (
            <div className="px-6 py-8 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn-ghost"
              >
                {isFetchingNextPage ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
