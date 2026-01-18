'use client'

import { useState, useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesService } from '@/lib/api/services/communities'
import { Users, Plus, Loader2, Search as SearchIcon, UserPlus, UserMinus } from 'lucide-react'
import Link from 'next/link'
import type { Community } from '@/lib/types'

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  // Fetch all communities
  const { data, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () =>
      communitiesService.getCommunities({
        page: 1,
        limit: 50,
      }),
  })

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: (slug: string) => communitiesService.joinCommunity(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: (slug: string) => communitiesService.leaveCommunity(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  // Filter communities based on search query
  const filteredCommunities = useMemo(() => {
    if (!data?.items) return []
    if (!searchQuery.trim()) return data.items

    const query = searchQuery.toLowerCase()
    return data.items.filter(
      (community) =>
        community.name.toLowerCase().includes(query) ||
        community.slug.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query)
    )
  }, [data?.items, searchQuery])

  const handleJoinLeave = (community: Community) => {
    if (community.isMember) {
      leaveMutation.mutate(community.slug)
    } else {
      joinMutation.mutate(community.slug)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="px-4 md:px-6 py-6 border-b-2 border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase">Communities</h1>
            </div>
            <Link href="/communities/create" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center min-h-[44px]">
              <Plus className="w-5 h-5" />
              <span className="whitespace-nowrap">Create Community</span>
            </Link>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="input w-full pl-12 min-h-[44px]"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Communities Grid */}
        <div className="px-4 md:px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && filteredCommunities.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg text-muted-foreground">
                {searchQuery ? `No communities found for "${searchQuery}"` : 'No communities found'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to create one!
              </p>
            </div>
          )}

          {!isLoading && filteredCommunities.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onJoinLeave={handleJoinLeave}
                  isLoading={
                    joinMutation.isPending || leaveMutation.isPending
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

interface CommunityCardProps {
  community: Community
  onJoinLeave: (community: Community) => void
  isLoading: boolean
}

function CommunityCard({ community, onJoinLeave, isLoading }: CommunityCardProps) {
  const communityUrl = `/community/${community.slug}`

  return (
    <div className="card h-full flex flex-col">
      {/* Cover Image */}
      {community.coverImageUrl && (
        <Link href={communityUrl}>
          <div className="relative w-full h-32 overflow-hidden border-b-2 border-card-border">
            <img
              src={community.coverImageUrl}
              alt={community.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={communityUrl} className="group">
          <h3 className="text-lg font-display font-bold uppercase mb-1 group-hover:text-primary transition-colors">
            {community.name}
          </h3>
          <p className="text-sm text-muted-foreground font-medium mb-3">
            c/{community.slug}
          </p>
        </Link>

        {community.description && (
          <p className="text-sm text-foreground-muted line-clamp-3 mb-4 flex-1">
            {community.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-card-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{community.memberCount.toLocaleString()} members</span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              onJoinLeave(community)
            }}
            disabled={isLoading}
            className={`px-3 sm:px-4 py-2 sm:py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all flex items-center gap-1.5 min-h-[44px] sm:min-h-0 ${
              community.isMember
                ? 'bg-transparent text-foreground border-border hover:bg-card-hover hover:border-border-strong active:bg-card-hover'
                : 'bg-primary text-primary-foreground border-border-strong hover:shadow-primary hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : community.isMember ? (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                Leave
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Join
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
