'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ReviewCard } from '@/components/discover/review-card'
import { useAllReviews } from '@/lib/hooks/use-discover'
import { Loader2, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReviewsPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useAllReviews(20)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [handleObserver])

  const allReviews = data?.pages.flatMap((page) => page.items) ?? []
  const totalReviews = data?.pages[0]?.total ?? 0

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold uppercase">Popular Reviews</h1>
          </div>
          <p className="text-muted-foreground">
            {totalReviews > 0
              ? `${totalReviews.toLocaleString()} reviews sorted by popularity`
              : 'Reviews from the community'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Failed to load reviews</p>
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
          </div>
        )}

        {/* Reviews List */}
        {!isLoading && !error && (
          <>
            {allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reviews found</p>
              </div>
            )}

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="py-8">
              {isFetchingNextPage && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {!hasNextPage && allReviews.length > 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  You&apos;ve reached the end
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
