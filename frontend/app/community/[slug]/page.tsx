'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesService } from '@/lib/api/services/communities'
import { AppLayout } from '@/components/layout/app-layout'
import { PostCard } from '@/components/posts/post-card'
import { ComposeFab } from '@/components/layout/compose-fab'
import { useAuthStore } from '@/lib/store/auth-store'
import { Users, Loader2, ChevronDown, ChevronUp, LogIn, LogOut } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function UserCommunityPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [showRules, setShowRules] = useState(false)
  const [page, setPage] = useState(1)

  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: () => communitiesService.getCommunity(slug),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'community', slug, page],
    queryFn: () => communitiesService.getCommunityPosts(slug, { page, limit: 20 }),
    enabled: !!community,
  })

  const joinMutation = useMutation({
    mutationFn: () => communitiesService.joinCommunity(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => communitiesService.leaveCommunity(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
    },
  })

  const handleJoinLeave = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (community?.isMember) {
      await leaveMutation.mutateAsync()
    } else {
      await joinMutation.mutateAsync()
    }
  }

  const handleLoadMore = () => {
    if (postsData?.hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  if (communityLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!community) {
    return (
      <AppLayout>
        <div className="px-6 py-12 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">Community Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The community you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
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
        {/* Community Header */}
        <div className="border-b-2 border-border">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Cover Image */}
            {community.coverImageUrl && (
              <div className="w-full h-32 md:h-48 mb-6 border-2 border-border shadow-md overflow-hidden">
                <Image
                  src={community.coverImageUrl}
                  alt={community.name}
                  width={800}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">c/{slug}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold uppercase mb-2">
                  {community.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">
                    {community.memberCount.toLocaleString()} {community.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>

              {/* Join/Leave Button */}
              <button
                onClick={handleJoinLeave}
                disabled={joinMutation.isPending || leaveMutation.isPending}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-border font-medium uppercase text-sm transition-colors ${
                  community.isMember
                    ? 'bg-card hover:bg-card-hover text-foreground'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {joinMutation.isPending || leaveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : community.isMember ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    Leave
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Join
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            {community.description && (
              <p className="text-foreground-muted leading-relaxed mb-4">
                {community.description}
              </p>
            )}

            {/* Rules Section */}
            {community.rules && (
              <div className="border-2 border-border bg-card">
                <button
                  onClick={() => setShowRules(!showRules)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-hover transition-colors"
                >
                  <span className="font-medium text-sm uppercase">Community Rules</span>
                  {showRules ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showRules && (
                  <div className="px-4 pb-4 border-t-2 border-border pt-4">
                    <p className="text-sm text-foreground-muted whitespace-pre-wrap leading-relaxed">
                      {community.rules}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="max-w-3xl mx-auto">
          {postsLoading && page === 1 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!postsLoading && postsData?.items.length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No posts yet</p>
              <p className="text-sm">Be the first to share something in this community!</p>
            </div>
          )}

          {postsData?.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Load More Button */}
          {postsData && postsData.hasMore && (
            <div className="px-6 py-6 border-t-2 border-border">
              <button
                onClick={handleLoadMore}
                disabled={postsLoading}
                className="w-full btn-ghost flex items-center justify-center gap-2"
              >
                {postsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load More</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show FAB only for community members */}
      {community.isMember && (
        <ComposeFab
          communityId={community.id}
          communitySlug={slug}
          communityName={community.name}
        />
      )}
    </AppLayout>
  )
}
