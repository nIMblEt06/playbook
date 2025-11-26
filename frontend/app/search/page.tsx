'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { useQuery } from '@tanstack/react-query'
import { searchService } from '@/lib/api/services/search'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'communities' | 'posts'>('all')

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', initialQuery, activeTab === 'all' ? undefined : activeTab],
    queryFn: () => searchService.search(initialQuery, activeTab === 'all' ? undefined : activeTab),
    enabled: initialQuery.length > 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const tabs = [
    { label: 'All', value: 'all' as const },
    { label: 'Users', value: 'users' as const },
    { label: 'Communities', value: 'communities' as const },
    { label: 'Posts', value: 'posts' as const },
  ]

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Search Header */}
        <div className="px-6 py-6 border-b-2 border-border">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users, communities, posts..."
                className="input w-full pl-12"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>

        {/* Tabs */}
        {initialQuery && (
          <div className="px-6 py-3 border-b-2 border-border flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-all ${
                  activeTab === tab.value
                    ? 'bg-foreground text-background'
                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!initialQuery && (
            <div className="text-center py-12 text-muted-foreground">
              Search for users, communities, or posts
            </div>
          )}

          {initialQuery && !isLoading && (
            <>
              {/* Users */}
              {(activeTab === 'all' || activeTab === 'users') && results?.users && results.users.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-display font-bold uppercase mb-4">Users</h3>
                  <div className="space-y-3">
                    {results.users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/u/${user.username}`}
                        className="flex items-center gap-4 p-4 card card-hover"
                      >
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName}
                            width={48}
                            height={48}
                            className="w-12 h-12 border-2 border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted border-2 border-border" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          {user.bio && (
                            <p className="text-sm text-foreground-muted mt-1 line-clamp-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                        {user.isArtist && (
                          <span className="text-[10px] px-2 py-1 bg-primary/20 text-primary font-bold uppercase">
                            Artist
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities */}
              {(activeTab === 'all' || activeTab === 'communities') && results?.communities && results.communities.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-display font-bold uppercase mb-4">Communities</h3>
                  <div className="space-y-3">
                    {results.communities.map((community) => (
                      <Link
                        key={community.id}
                        href={`/${community.type === 'artist' ? 'a' : 'c'}/${community.slug}`}
                        className="block p-4 card card-hover"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">
                            {community.type === 'artist' ? 'a/' : 'c/'}
                            {community.slug}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {community.memberCount} members
                          </span>
                        </div>
                        {community.description && (
                          <p className="text-sm text-foreground-muted line-clamp-2">
                            {community.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {!isLoading &&
                ((activeTab === 'users' && (!results?.users || results.users.length === 0)) ||
                  (activeTab === 'communities' && (!results?.communities || results.communities.length === 0)) ||
                  (activeTab === 'posts' && (!results?.posts || results.posts.length === 0)) ||
                  (activeTab === 'all' &&
                    (!results?.users || results.users.length === 0) &&
                    (!results?.communities || results.communities.length === 0) &&
                    (!results?.posts || results.posts.length === 0))) && (
                  <div className="text-center py-12 text-muted-foreground">
                    No results found for "{initialQuery}"
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
