import { prisma } from '../utils/prisma.js';
import type { CreatePlaylistInput, UpdatePlaylistInput, AddTrackInput } from '../schemas/playlist.schema.js';
import type { PaginationInput } from '../schemas/user.schema.js';

export class PlaylistService {
  async createPlaylist(ownerId: string, input: CreatePlaylistInput) {
    const playlist = await prisma.playlist.create({
      data: {
        ownerId,
        name: input.name,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        isPublic: input.isPublic,
      },
    });

    return playlist;
  }

  async getPlaylistById(playlistId: string, currentUserId?: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tracks: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      return null;
    }

    // Check visibility
    if (!playlist.isPublic && playlist.ownerId !== currentUserId) {
      throw new Error('Playlist is private');
    }

    return playlist;
  }

  async updatePlaylist(playlistId: string, userId: string, input: UpdatePlaylistInput) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.ownerId !== userId) {
      throw new Error('Not authorized to update this playlist');
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        name: input.name,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        isPublic: input.isPublic,
      },
    });

    return updated;
  }

  async deletePlaylist(playlistId: string, userId: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.ownerId !== userId) {
      throw new Error('Not authorized to delete this playlist');
    }

    await prisma.playlist.delete({
      where: { id: playlistId },
    });

    return { success: true };
  }

  async addTrack(playlistId: string, userId: string, input: AddTrackInput) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.ownerId !== userId) {
      throw new Error('Not authorized to modify this playlist');
    }

    // Get position (add to end if not specified)
    let position = input.position;
    if (position === undefined) {
      const lastTrack = await prisma.playlistTrack.findFirst({
        where: { playlistId },
        orderBy: { position: 'desc' },
      });
      position = lastTrack ? lastTrack.position + 1 : 0;
    }

    const [track] = await prisma.$transaction([
      prisma.playlistTrack.create({
        data: {
          playlistId,
          linkUrl: input.linkUrl,
          title: input.title,
          artist: input.artist,
          position,
        },
      }),
      prisma.playlist.update({
        where: { id: playlistId },
        data: { trackCount: { increment: 1 } },
      }),
    ]);

    return track;
  }

  async removeTrack(playlistId: string, trackId: string, userId: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.ownerId !== userId) {
      throw new Error('Not authorized to modify this playlist');
    }

    const track = await prisma.playlistTrack.findFirst({
      where: { id: trackId, playlistId },
    });

    if (!track) {
      throw new Error('Track not found in playlist');
    }

    await prisma.$transaction([
      prisma.playlistTrack.delete({
        where: { id: trackId },
      }),
      prisma.playlist.update({
        where: { id: playlistId },
        data: { trackCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async reorderTracks(playlistId: string, userId: string, trackIds: string[]) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    if (playlist.ownerId !== userId) {
      throw new Error('Not authorized to modify this playlist');
    }

    // Update positions in transaction
    await prisma.$transaction(
      trackIds.map((trackId, index) =>
        prisma.playlistTrack.update({
          where: { id: trackId },
          data: { position: index },
        })
      )
    );

    return { success: true };
  }

  async getUserPlaylists(username: string, pagination: PaginationInput, currentUserId?: string) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Only show public playlists unless viewing own profile
    const isOwner = user.id === currentUserId;

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: {
          ownerId: user.id,
          ...(isOwner ? {} : { isPublic: true }),
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { tracks: true },
          },
        },
      }),
      prisma.playlist.count({
        where: {
          ownerId: user.id,
          ...(isOwner ? {} : { isPublic: true }),
        },
      }),
    ]);

    return {
      data: playlists.map((p) => ({
        ...p,
        trackCount: p._count.tracks,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const playlistService = new PlaylistService();
