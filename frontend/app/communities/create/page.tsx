'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'
import { communitiesService } from '@/lib/api/services/communities'
import { Users, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    // Only auto-generate if user hasn't manually edited the slug
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    setSlug(autoSlug)
  }

  const createMutation = useMutation({
    mutationFn: () =>
      communitiesService.createCommunity({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        rules: rules.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
      }),
    onSuccess: (community) => {
      router.push(`/community/${community.slug}`)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create community')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Community name is required')
      return
    }
    if (!slug.trim()) {
      setError('Community URL slug is required')
      return
    }
    if (slug.length < 3) {
      setError('Slug must be at least 3 characters')
      return
    }

    createMutation.mutate()
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Communities
          </Link>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold uppercase">Create Community</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Start a new community for fans to discuss music, artists, or any topic.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border-2 border-destructive text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold uppercase tracking-wide mb-2">
              Community Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Indie Rock Fans"
              className="input w-full"
              maxLength={100}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-bold uppercase tracking-wide mb-2">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-4 py-3 bg-muted border-2 border-r-0 border-border text-muted-foreground">
                trackd.app/community/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="indie-rock-fans"
                className="input flex-1"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              className="input w-full min-h-[100px] resize-y"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Rules */}
          <div>
            <label htmlFor="rules" className="block text-sm font-bold uppercase tracking-wide mb-2">
              Community Rules
            </label>
            <textarea
              id="rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Set guidelines for your community members..."
              className="input w-full min-h-[100px] resize-y"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {rules.length}/1000 characters
            </p>
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-bold uppercase tracking-wide mb-2">
              Cover Image URL
            </label>
            <div className="flex gap-2">
              <input
                id="coverImage"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input flex-1"
              />
            </div>
            {coverImageUrl && (
              <div className="mt-3 relative w-full h-32 overflow-hidden border-2 border-border">
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            {!coverImageUrl && (
              <div className="mt-3 flex items-center justify-center w-full h-32 border-2 border-dashed border-border bg-muted/50">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No cover image</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Link href="/communities" className="btn-ghost flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim() || !slug.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Community'
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
