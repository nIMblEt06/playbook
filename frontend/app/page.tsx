'use client'

import Link from 'next/link'
import Image from 'next/image'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth } from '@/components/auth/require-auth'
import { AlbumCard } from '@/components/discover/album-card'
import { ReviewCard } from '@/components/discover/review-card'
import { Section, HorizontalScroll } from '@/components/discover/section'
import { useHomepageData } from '@/lib/hooks/use-discover'
import { Loader2, Music, Star, Clock, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  )
}

function HomeContent() {
  const { data, isLoading, error, refetch } = useHomepageData()

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Discover</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore new music and see what the community is listening to
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <p className="text-sm sm:text-base text-destructive mb-4">Failed to load discover page</p>
            <button onClick={() => refetch()} className="btn-primary text-sm sm:text-base">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {/* New Music Section */}
            <Section
              title="New Music"
              subtitle="Fresh releases from around the world"
              href="/discover/new-releases"
            >
              {data.newReleases.length > 0 ? (
                <HorizontalScroll>
                  {data.newReleases.map((release) => (
                    <AlbumCard key={release.id} album={release} size="md" />
                  ))}
                </HorizontalScroll>
              ) : (
                <EmptyState
                  icon={<Music className="w-6 h-6 sm:w-8 sm:h-8" />}
                  message="No new releases found"
                />
              )}
            </Section>

            {/* Recently Played Section */}
            <Section
              title="Recently Played"
              subtitle="Albums you've been listening to"
              href="/library"
            >
              {data.recentlyLogged.length > 0 ? (
                <HorizontalScroll>
                  {data.recentlyLogged.map((album) => (
                    <AlbumCard key={album.id} album={album} size="md" />
                  ))}
                </HorizontalScroll>
              ) : (
                <EmptyState
                  icon={<Clock className="w-6 h-6 sm:w-8 sm:h-8" />}
                  message="No recent listening history. Play some music on Spotify!"
                />
              )}
            </Section>

            {/* Popular Reviews Section */}
            <Section
              title="Popular Reviews"
              subtitle="Top reviews from this week"
              href="/discover/reviews"
            >
              {data.popularReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {data.popularReviews.slice(0, 4).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Star className="w-6 h-6 sm:w-8 sm:h-8" />}
                  message="No reviews yet. Write the first one!"
                />
              )}
            </Section>

            {/* Community Activity Section */}
            {data.communityActivity.length > 0 && (
              <Section
                title="Community Activity"
                subtitle="Recent posts from your communities"
                href="/communities"
              >
                <div className="space-y-2 sm:space-y-3">
                  {data.communityActivity.slice(0, 5).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  message: string
}

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
      {icon}
      <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-center px-4">{message}</p>
    </div>
  )
}

interface ActivityItemProps {
  activity: {
    id: string
    type: string
    user: {
      id: string
      username: string
      displayName: string
      avatarUrl: string | null
    }
    content: string
    community: {
      id: string
      slug: string
      name: string
    } | null
    createdAt: string
  }
}

function ActivityItem({ activity }: ActivityItemProps) {
  const href = activity.community
    ? `/community/${activity.community.slug}#post-${activity.id}`
    : '#'

  return (
    <Link
      href={href}
      className="flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
        {activity.user.avatarUrl ? (
          <Image
            src={activity.user.avatarUrl}
            alt={activity.user.displayName}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap">
          <span className="font-medium">{activity.user.displayName}</span>
          {activity.community && (
            <>
              <span className="text-muted-foreground">in</span>
              <span className="text-primary">{activity.community.name}</span>
            </>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1">
          {activity.content}
        </p>
      </div>
    </Link>
  )
}
