import { apiClient } from '../client'
import type { Playlist, PlaylistTrack } from '../../types'

export interface CreatePlaylistRequest {
  name: string
  description?: string
  coverImageUrl?: string
  isPublic?: boolean
}

export interface UpdatePlaylistRequest {
  name?: string
  description?: string
  coverImageUrl?: string
  isPublic?: boolean
}

export interface AddTrackRequest {
  linkUrl: string
  title: string
  artist: string
  position?: number
}

export const playlistsService = {
  async getPlaylists(): Promise<Playlist[]> {
    const response = await apiClient.get<{ playlists: Playlist[] }>('/api/playlists')
    return response.data.playlists
  },

  async createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
    const response = await apiClient.post<{ playlist: Playlist }>('/api/playlists', data)
    return response.data.playlist
  },

  async getPlaylist(id: string): Promise<Playlist> {
    const response = await apiClient.get<{ playlist: Playlist }>(`/api/playlists/${id}`)
    return response.data.playlist
  },

  async updatePlaylist(id: string, data: UpdatePlaylistRequest): Promise<Playlist> {
    const response = await apiClient.patch<{ playlist: Playlist }>(`/api/playlists/${id}`, data)
    return response.data.playlist
  },

  async deletePlaylist(id: string): Promise<void> {
    await apiClient.delete(`/api/playlists/${id}`)
  },

  async addTrack(playlistId: string, data: AddTrackRequest): Promise<PlaylistTrack> {
    const response = await apiClient.post<{ track: PlaylistTrack }>(
      `/api/playlists/${playlistId}/tracks`,
      data
    )
    return response.data.track
  },

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    await apiClient.delete(`/api/playlists/${playlistId}/tracks/${trackId}`)
  },

  async reorderTracks(playlistId: string, trackIds: string[]): Promise<void> {
    await apiClient.put(`/api/playlists/${playlistId}/tracks/reorder`, { trackIds })
  },
}

