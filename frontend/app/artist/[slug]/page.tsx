'use client'

import { useParams, redirect } from 'next/navigation'

// Redirect old artist community URLs to the unified community page
export default function ArtistCommunityRedirect() {
  const params = useParams()
  const slug = params.slug as string

  redirect(`/community/${slug}`)
}
