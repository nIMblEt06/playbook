'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { AlbumCard } from '@/components/discover/album-card'
import { useNewReleases } from '@/lib/hooks/use-discover'
import { Loader2, Disc, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewReleasesPage() {
  const { data, isLoading, error } = useNewReleases(50)

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-6xl mx-auto px-4 py-6">
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
            <Disc className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold uppercase">New Releases</h1>
          </div>
          <p className="text-muted-foreground">
            The latest albums and singles
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
            <p className="text-destructive mb-4">Failed to load new releases</p>
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
          </div>
        )}

        {/* Releases Grid */}
        {!isLoading && !error && data?.releases && (
          <>
            {data.releases.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.releases.map((release) => (
                  <AlbumCard key={release.id} album={release} size="md" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Disc className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No new releases found</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
