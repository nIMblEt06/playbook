import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playlistsService, type CreatePlaylistRequest, type UpdatePlaylistRequest, type AddTrackRequest } from '../api/services/playlists'

export function usePlaylists() {
  return useQuery({
    queryKey: ['user-playlists'],
    queryFn: () => playlistsService.getPlaylists(),
  })
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistsService.getPlaylist(id),
    enabled: !!id,
  })
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlaylistRequest) => playlistsService.createPlaylist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] })
    },
  })
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlaylistRequest }) =>
      playlistsService.updatePlaylist(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] })
    },
  })
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => playlistsService.deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] })
    },
  })
}

export function useAddTrack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playlistId, data }: { playlistId: string; data: AddTrackRequest }) =>
      playlistsService.addTrack(playlistId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] })
    },
  })
}

export function useRemoveTrack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      playlistsService.removeTrack(playlistId, trackId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] })
    },
  })
}

export function useReorderTracks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playlistId, trackIds }: { playlistId: string; trackIds: string[] }) =>
      playlistsService.reorderTracks(playlistId, trackIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] })
    },
  })
}
