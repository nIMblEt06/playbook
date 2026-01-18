import { useQuery } from '@tanstack/react-query'
import { artistsService } from '../api/services/artists'

export function useArtist(spotifyId: string) {
  return useQuery({
    queryKey: ['artist', spotifyId],
    queryFn: () => artistsService.getArtist(spotifyId),
    enabled: !!spotifyId,
  })
}

export function useArtistAlbums(
  spotifyId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['artist', spotifyId, 'albums', params],
    queryFn: () => artistsService.getArtistAlbums(spotifyId, params),
    enabled: !!spotifyId,
  })
}

export function useArtistDiscography(
  spotifyId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['artist', spotifyId, 'discography', params],
    queryFn: () => artistsService.getArtistDiscography(spotifyId, params),
    enabled: !!spotifyId,
  })
}

export function useArtistReviews(
  spotifyId: string,
  params?: { page?: number; limit?: number; sort?: string }
) {
  return useQuery({
    queryKey: ['artist', spotifyId, 'reviews', params],
    queryFn: () => artistsService.getArtistReviews(spotifyId, params),
    enabled: !!spotifyId,
  })
}
