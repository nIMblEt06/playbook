'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/lib/api/services/users'
import { AppLayout } from '@/components/layout/app-layout'
import { PostCard } from '@/components/posts/post-card'
import { ActivityCard } from '@/components/activity/activity-card'
import { useAuthStore } from '@/lib/store/auth-store'
import { Music2, Loader2, Settings, FileText, Activity } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const username = params.username as string
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'posts' | 'activity'>('posts')
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const highlightedPostRef = useRef<HTMLDivElement>(null)

  // Handle post query param for scrolling to specific post from notifications
  const postIdFromUrl = searchParams.get('post')
  const showCommentsFromUrl = searchParams.get('showComments') === 'true'

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => usersService.getUser(username),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', username],
    queryFn: () => usersService.getUserPosts(username),
    enabled: activeTab === 'posts',
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', 'user', username],
    queryFn: () => usersService.getUserReviews(username),
    enabled: activeTab === 'activity',
  })

  // Set highlighted post from URL query param
  useEffect(() => {
    if (postIdFromUrl) {
      setHighlightedPostId(postIdFromUrl)
      // Clear the highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedPostId(null)
        // Clean up the URL by removing the query param
        router.replace(`/profile/${username}`, { scroll: false })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [postIdFromUrl, router, username])

  // Scroll to highlighted post when posts data loads
  useEffect(() => {
    if (highlightedPostId && postsData?.items && highlightedPostRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        highlightedPostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [highlightedPostId, postsData])

  const isOwnProfile = currentUser?.username === username
  const isFollowing = profile?.isFollowing ?? false

  const followMutation = useMutation({
    mutationFn: () => usersService.followUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => usersService.unfollowUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
    },
  })

  const isFollowPending = followMutation.isPending || unfollowMutation.isPending

  const handleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate()
    } else {
      followMutation.mutate()
    }
  }

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="px-4 md:px-6 py-12 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">User Not Found</h2>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div>
        {/* Profile Header */}
        <div className="border-b-2 border-border">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Avatar & Action Button Row (Mobile) */}
              <div className="flex items-start justify-between md:block">
                {/* Avatar */}
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    width={120}
                    height={120}
                    className="w-20 h-20 md:w-32 md:h-32 border-4 border-border shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-muted border-4 border-border shadow-md" />
                )}

                {/* Action Button (Mobile only) */}
                <div className="md:hidden">
                  {isOwnProfile ? (
                    <Link href="/settings" className="btn-ghost flex items-center text-xs px-3 py-2">
                      <Settings className="w-3 h-3 mr-1.5" />
                      Edit
                    </Link>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowPending}
                      className={`group text-xs px-4 py-2 disabled:opacity-50 ${
                        isFollowing
                          ? 'btn-ghost border-2 border-border hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                          : 'btn-primary'
                      }`}
                    >
                      {isFollowPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <span className="group-hover:hidden">Following</span>
                          <span className="hidden group-hover:inline">Unfollow</span>
                        </>
                      ) : (
                        'Follow'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-3xl font-display font-bold uppercase mb-1 break-words">
                      {profile.displayName}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">@{profile.username}</p>
                  </div>
                  {/* Action Button (Desktop only) */}
                  <div className="hidden md:block ml-4">
                    {isOwnProfile ? (
                      <Link href="/settings" className="btn-ghost flex items-center whitespace-nowrap">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    ) : (
                      <button
                        onClick={handleFollow}
                        disabled={isFollowPending}
                        className={`group whitespace-nowrap disabled:opacity-50 ${
                          isFollowing
                            ? 'btn-ghost border-2 border-border hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                            : 'btn-primary'
                        }`}
                      >
                        {isFollowPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <span className="group-hover:hidden">Following</span>
                            <span className="hidden group-hover:inline">Unfollow</span>
                          </>
                        ) : (
                          'Follow'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats (Mobile: immediately after name) */}
                <div className="flex gap-4 md:gap-6 mb-4 text-sm md:text-base">
                  <div>
                    <span className="font-bold text-foreground">
                      {profile._count?.posts || 0}
                    </span>{' '}
                    <span className="text-muted-foreground text-xs md:text-sm">posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      {profile._count?.followers || 0}
                    </span>{' '}
                    <span className="text-muted-foreground text-xs md:text-sm">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      {profile._count?.following || 0}
                    </span>{' '}
                    <span className="text-muted-foreground text-xs md:text-sm">following</span>
                  </div>
                </div>

                {/* Badges */}
                {profile.isArtist && (
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2 md:px-3 py-1 bg-primary/20 border-2 border-primary text-primary text-xs font-bold uppercase">
                      Artist
                    </span>
                    {profile.artistName && (
                      <span className="text-xs md:text-sm text-muted-foreground break-words">
                        {profile.artistName}
                      </span>
                    )}
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-foreground-muted mb-4 text-sm md:text-base break-words">{profile.bio}</p>
                )}

                {/* Streaming Links */}
                {profile.streamingLinks && Object.keys(profile.streamingLinks).length > 0 && (
                  <div className="flex gap-2 md:gap-3 flex-wrap">
                    {profile.streamingLinks.spotify && (
                      <a
                        href={profile.streamingLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-border text-xs font-medium transition-colors"
                      >
                        <Music2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Spotify</span>
                        <span className="sm:hidden">SP</span>
                      </a>
                    )}
                    {profile.streamingLinks.appleMusic && (
                      <a
                        href={profile.streamingLinks.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-border text-xs font-medium transition-colors"
                      >
                        <Music2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Apple Music</span>
                        <span className="sm:hidden">AM</span>
                      </a>
                    )}
                    {profile.streamingLinks.soundcloud && (
                      <a
                        href={profile.streamingLinks.soundcloud}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-border text-xs font-medium transition-colors"
                      >
                        <Music2 className="w-3 h-3" />
                        <span className="hidden sm:inline">SoundCloud</span>
                        <span className="sm:hidden">SC</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div className="flex gap-4 md:gap-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-1.5 md:gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'posts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 md:gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'activity'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Activity</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === 'posts' ? (
            <>
              {postsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {!postsLoading && postsData?.items.length === 0 && (
                <div className="px-4 md:px-6 py-12 text-center text-muted-foreground text-sm md:text-base">
                  No posts yet
                </div>
              )}

              {postsData?.items.map((post) => {
                const isHighlighted = post.id === highlightedPostId
                return (
                  <div
                    key={post.id}
                    ref={isHighlighted ? highlightedPostRef : undefined}
                    className={`transition-all duration-500 ${
                      isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    }`}
                  >
                    <PostCard
                      post={post}
                      defaultShowComments={isHighlighted && showCommentsFromUrl}
                    />
                  </div>
                )
              })}
            </>
          ) : (
            <div className="px-4 md:px-6 py-4 md:py-6 space-y-3 md:space-y-4">
              {reviewsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {!reviewsLoading && reviewsData?.items.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm md:text-base">
                  No activity yet
                </div>
              )}

              {reviewsData?.items.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
