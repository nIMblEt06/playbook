import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { albumsService } from '../api/services/albums'

export function useAlbum(spotifyId: string) {
  return useQuery({
    queryKey: ['album', spotifyId],
    queryFn: () => albumsService.getAlbum(spotifyId),
    enabled: !!spotifyId,
  })
}

export function useAlbumTracks(spotifyId: string) {
  return useQuery({
    queryKey: ['album', spotifyId, 'tracks'],
    queryFn: () => albumsService.getAlbumTracks(spotifyId),
    enabled: !!spotifyId,
  })
}

export function useAlbumReviews(
  spotifyId: string,
  params?: { page?: number; limit?: number; sort?: string }
) {
  return useQuery({
    queryKey: ['album', spotifyId, 'reviews', params],
    queryFn: () => albumsService.getAlbumReviews(spotifyId, params),
    enabled: !!spotifyId,
  })
}

export function useCreateOrUpdateReview(spotifyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { rating?: number; title?: string; content?: string }) =>
      albumsService.createOrUpdateReview(spotifyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', spotifyId] })
      queryClient.invalidateQueries({ queryKey: ['album', spotifyId, 'reviews'] })
    },
  })
}

export function useRateAlbum(spotifyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rating: number) => albumsService.rateAlbum(spotifyId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', spotifyId] })
    },
  })
}

export function useRemoveRating(spotifyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => albumsService.removeRating(spotifyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', spotifyId] })
    },
  })
}
