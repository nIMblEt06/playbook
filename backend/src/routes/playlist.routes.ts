import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { playlistService } from '../services/playlist.service.js';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addTrackSchema,
  reorderTracksSchema,
  type CreatePlaylistInput,
  type UpdatePlaylistInput,
  type AddTrackInput,
} from '../schemas/playlist.schema.js';
import { paginationSchema } from '../schemas/user.schema.js';

interface PlaylistParams {
  id: string;
}

interface TrackParams {
  id: string;
  trackId: string;
}

export async function playlistRoutes(fastify: FastifyInstance) {
  // POST /api/playlists
  fastify.post<{ Body: CreatePlaylistInput }>(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: CreatePlaylistInput }>, reply: FastifyReply) => {
      try {
        const input = createPlaylistSchema.parse(request.body);
        const playlist = await playlistService.createPlaylist(request.user.userId, input);
        return reply.code(201).send({ playlist });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/playlists/:id
  fastify.get<{ Params: PlaylistParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: PlaylistParams }>, reply: FastifyReply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const playlist = await playlistService.getPlaylistById(
          request.params.id,
          currentUserId
        );

        if (!playlist) {
          return reply.code(404).send({ error: 'Playlist not found' });
        }

        return reply.send({ playlist });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Playlist is private') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // PATCH /api/playlists/:id
  fastify.patch<{ Params: PlaylistParams; Body: UpdatePlaylistInput }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PlaylistParams; Body: UpdatePlaylistInput }>, reply: FastifyReply) => {
      try {
        const input = updatePlaylistSchema.parse(request.body);
        const playlist = await playlistService.updatePlaylist(
          request.params.id,
          request.user.userId,
          input
        );
        return reply.send({ playlist });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Playlist not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to update this playlist') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/playlists/:id
  fastify.delete<{ Params: PlaylistParams }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PlaylistParams }>, reply: FastifyReply) => {
      try {
        await playlistService.deletePlaylist(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Playlist not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to delete this playlist') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/playlists/:id/tracks
  fastify.post<{ Params: PlaylistParams; Body: AddTrackInput }>(
    '/:id/tracks',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PlaylistParams; Body: AddTrackInput }>, reply: FastifyReply) => {
      try {
        const input = addTrackSchema.parse(request.body);
        const track = await playlistService.addTrack(
          request.params.id,
          request.user.userId,
          input
        );
        return reply.code(201).send({ track });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Playlist not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to modify this playlist') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/playlists/:id/tracks/:trackId
  fastify.delete<{ Params: TrackParams }>(
    '/:id/tracks/:trackId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: TrackParams }>, reply: FastifyReply) => {
      try {
        await playlistService.removeTrack(
          request.params.id,
          request.params.trackId,
          request.user.userId
        );
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Playlist not found' || error.message === 'Track not found in playlist') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to modify this playlist') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // PUT /api/playlists/:id/tracks/reorder
  fastify.put<{ Params: PlaylistParams; Body: { trackIds: string[] } }>(
    '/:id/tracks/reorder',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PlaylistParams; Body: { trackIds: string[] } }>, reply: FastifyReply) => {
      try {
        const { trackIds } = reorderTracksSchema.parse(request.body);
        await playlistService.reorderTracks(
          request.params.id,
          request.user.userId,
          trackIds
        );
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Playlist not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to modify this playlist') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
