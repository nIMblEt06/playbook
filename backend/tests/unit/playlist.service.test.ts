import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { playlistService } from '../../src/services/playlist.service.js';
import {
  mockUsers,
  mockPlaylists,
  mockPlaylistTracks,
  mockPlaylistWithTracks,
  validCreatePlaylistInput,
  validAddTrackInput,
} from '../fixtures/index.js';

describe('PlaylistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPlaylist', () => {
    it('should create a new playlist', async () => {
      vi.mocked(prisma.playlist.create).mockResolvedValue(mockPlaylists.playlist1 as any);

      const result = await playlistService.createPlaylist(
        mockUsers.user1.id,
        validCreatePlaylistInput
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(mockPlaylists.playlist1.name);
      expect(prisma.playlist.create).toHaveBeenCalledWith({
        data: {
          ownerId: mockUsers.user1.id,
          name: validCreatePlaylistInput.name,
          description: validCreatePlaylistInput.description,
          coverImageUrl: validCreatePlaylistInput.coverImageUrl,
          isPublic: validCreatePlaylistInput.isPublic,
        },
      });
    });
  });

  describe('getPlaylistById', () => {
    it('should return playlist with tracks for owner', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylistWithTracks as any);

      const result = await playlistService.getPlaylistById(
        mockPlaylists.playlist1.id,
        mockUsers.user1.id
      );

      expect(result).toBeDefined();
      expect(result?.tracks).toHaveLength(2);
    });

    it('should return public playlist for non-owner', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylistWithTracks as any);

      const result = await playlistService.getPlaylistById(
        mockPlaylists.playlist1.id,
        mockUsers.user2.id
      );

      expect(result).toBeDefined();
    });

    it('should throw error for private playlist accessed by non-owner', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue({
        ...mockPlaylists.privatePlaylist,
        owner: mockUsers.user2,
        tracks: [],
      } as any);

      await expect(
        playlistService.getPlaylistById(mockPlaylists.privatePlaylist.id, mockUsers.user1.id)
      ).rejects.toThrow('Playlist is private');
    });

    it('should return null for non-existent playlist', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(null);

      const result = await playlistService.getPlaylistById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updatePlaylist', () => {
    it('should update playlist by owner', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);
      vi.mocked(prisma.playlist.update).mockResolvedValue({
        ...mockPlaylists.playlist1,
        name: 'Updated Playlist',
      } as any);

      const result = await playlistService.updatePlaylist(
        mockPlaylists.playlist1.id,
        mockUsers.user1.id,
        { name: 'Updated Playlist' }
      );

      expect(result.name).toBe('Updated Playlist');
    });

    it('should throw error for non-existent playlist', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(null);

      await expect(
        playlistService.updatePlaylist('non-existent', mockUsers.user1.id, { name: 'Test' })
      ).rejects.toThrow('Playlist not found');
    });

    it('should throw error for unauthorized user', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);

      await expect(
        playlistService.updatePlaylist(
          mockPlaylists.playlist1.id,
          mockUsers.user2.id,
          { name: 'Test' }
        )
      ).rejects.toThrow('Not authorized to update this playlist');
    });
  });

  describe('deletePlaylist', () => {
    it('should delete playlist by owner', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);
      vi.mocked(prisma.playlist.delete).mockResolvedValue({} as any);

      const result = await playlistService.deletePlaylist(
        mockPlaylists.playlist1.id,
        mockUsers.user1.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error for unauthorized user', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);

      await expect(
        playlistService.deletePlaylist(mockPlaylists.playlist1.id, mockUsers.user2.id)
      ).rejects.toThrow('Not authorized to delete this playlist');
    });
  });

  describe('addTrack', () => {
    it('should add track to playlist', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);
      vi.mocked(prisma.playlistTrack.findFirst).mockResolvedValue({
        position: 14,
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { ...mockPlaylistTracks.track1, id: 'new-track-id' },
        {},
      ] as any);

      const result = await playlistService.addTrack(
        mockPlaylists.playlist1.id,
        mockUsers.user1.id,
        validAddTrackInput
      );

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent playlist', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(null);

      await expect(
        playlistService.addTrack('non-existent', mockUsers.user1.id, validAddTrackInput)
      ).rejects.toThrow('Playlist not found');
    });

    it('should throw error for unauthorized user', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);

      await expect(
        playlistService.addTrack(
          mockPlaylists.playlist1.id,
          mockUsers.user2.id,
          validAddTrackInput
        )
      ).rejects.toThrow('Not authorized to modify this playlist');
    });
  });

  describe('removeTrack', () => {
    it('should remove track from playlist', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);
      vi.mocked(prisma.playlistTrack.findFirst).mockResolvedValue(
        mockPlaylistTracks.track1 as any
      );
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await playlistService.removeTrack(
        mockPlaylists.playlist1.id,
        mockPlaylistTracks.track1.id,
        mockUsers.user1.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent track', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);
      vi.mocked(prisma.playlistTrack.findFirst).mockResolvedValue(null);

      await expect(
        playlistService.removeTrack(
          mockPlaylists.playlist1.id,
          'non-existent',
          mockUsers.user1.id
        )
      ).rejects.toThrow('Track not found in playlist');
    });
  });

  describe('reorderTracks', () => {
    it('should reorder tracks', async () => {
      vi.mocked(prisma.playlist.findUnique).mockResolvedValue(mockPlaylists.playlist1 as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const trackIds = [mockPlaylistTracks.track2.id, mockPlaylistTracks.track1.id];
      const result = await playlistService.reorderTracks(
        mockPlaylists.playlist1.id,
        mockUsers.user1.id,
        trackIds
      );

      expect(result.success).toBe(true);
    });
  });

  describe('getUserPlaylists', () => {
    it('should return public playlists for non-owner', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUsers.user1.id } as any);
      vi.mocked(prisma.playlist.findMany).mockResolvedValue([
        { ...mockPlaylists.playlist1, _count: { tracks: 15 } },
      ] as any);
      vi.mocked(prisma.playlist.count).mockResolvedValue(1);

      const result = await playlistService.getUserPlaylists(
        'testuser1',
        { page: 1, limit: 20 },
        mockUsers.user2.id
      );

      expect(result.data).toHaveLength(1);
      expect(prisma.playlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ownerId: mockUsers.user1.id,
            isPublic: true,
          },
        })
      );
    });

    it('should return all playlists for owner', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUsers.user1.id } as any);
      vi.mocked(prisma.playlist.findMany).mockResolvedValue([
        { ...mockPlaylists.playlist1, _count: { tracks: 15 } },
        { ...mockPlaylists.playlist2, _count: { tracks: 20 } },
      ] as any);
      vi.mocked(prisma.playlist.count).mockResolvedValue(2);

      const result = await playlistService.getUserPlaylists(
        'testuser1',
        { page: 1, limit: 20 },
        mockUsers.user1.id
      );

      expect(result.data).toHaveLength(2);
      expect(prisma.playlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ownerId: mockUsers.user1.id,
          },
        })
      );
    });

    it('should throw error for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        playlistService.getUserPlaylists('nonexistent', { page: 1, limit: 20 })
      ).rejects.toThrow('User not found');
    });
  });
});
