import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as albumService from '../services/album.service.js';
import * as reviewService from '../services/review.service.js';
import * as spotifySearchService from '../services/spotify-search.service.js';
import { z } from 'zod';

interface AlbumParams {
  spotifyId: string;
}

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['recent', 'engaged', 'rating_high', 'rating_low']).default('recent'),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional().nullable(),
  content: z.string().max(5000).optional().nullable(),
});

const ratingSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export async function albumRoutes(fastify: FastifyInstance) {
  // GET /api/albums/:spotifyId - Get album by Spotify ID
  fastify.get<{ Params: AlbumParams }>(
    '/:spotifyId',
    async (request: FastifyRequest<{ Params: AlbumParams }>, reply: FastifyReply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const album = await albumService.getAlbumBySpotifyId(
          request.params.spotifyId,
          currentUserId
        );

        if (!album) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        return reply.send({ album });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/albums/:spotifyId/reviews - Get reviews for album
  fastify.get<{ Params: AlbumParams; Querystring: z.infer<typeof reviewQuerySchema> }>(
    '/:spotifyId/reviews',
    async (request, reply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const query = reviewQuerySchema.parse(request.query);

        // First get the album
        const albumResult = await albumService.getOrCreateAlbum(request.params.spotifyId);
        if (!albumResult) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        const result = await reviewService.getAlbumReviews(
          albumResult.album.id,
          query.page,
          query.limit,
          query.sort,
          currentUserId
        );

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/albums/:spotifyId/reviews - Create or update review for album
  fastify.post<{ Params: AlbumParams; Body: z.infer<typeof createReviewSchema> }>(
    '/:spotifyId/reviews',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const input = createReviewSchema.parse(request.body);

        // First get the album
        const albumResult = await albumService.getOrCreateAlbum(request.params.spotifyId);
        if (!albumResult) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        const review = await reviewService.createOrUpdateReview({
          authorId: request.user.userId,
          targetType: 'album',
          albumId: albumResult.album.id,
          rating: input.rating,
          title: input.title ?? undefined,
          content: input.content ?? undefined,
        });

        return reply.code(201).send({ review });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/albums/:spotifyId/rate - Quick rate album (without full review)
  fastify.post<{ Params: AlbumParams; Body: z.infer<typeof ratingSchema> }>(
    '/:spotifyId/rate',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const input = ratingSchema.parse(request.body);

        // First get the album
        const albumResult = await albumService.getOrCreateAlbum(request.params.spotifyId);
        if (!albumResult) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        const rating = await reviewService.rateAlbum(
          request.user.userId,
          albumResult.album.id,
          input.value
        );

        return reply.code(201).send({ rating });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/albums/:spotifyId/rate - Remove rating
  fastify.delete<{ Params: AlbumParams }>(
    '/:spotifyId/rate',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // First get the album
        const albumResult = await albumService.getOrCreateAlbum(request.params.spotifyId);
        if (!albumResult) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        await reviewService.removeRating(request.user.userId, 'album', albumResult.album.id);

        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/albums/:spotifyId/tracks - Get album tracks from Spotify
  fastify.get<{ Params: AlbumParams }>(
    '/:spotifyId/tracks',
    async (request, reply) => {
      try {
        // Get current user ID for Spotify token (optional auth)
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated - will use client credentials
        }

        // Fetch tracks from Spotify API
        const spotifyTracks = await spotifySearchService.getAlbumTracks(
          request.params.spotifyId,
          currentUserId
        );

        // Transform to the expected format
        const tracks = spotifyTracks.map((track, index) => ({
          id: track.id,
          spotifyId: track.id,
          title: track.name,
          artistName: track.artists.map(a => a.name).join(', '),
          position: track.track_number || index + 1,
          duration: track.duration_ms,
          previewUrl: (track as any).preview_url || null,
          spotifyUri: `spotify:track:${track.id}`,
        }));

        return reply.send({ tracks });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/albums/search - Search albums locally
  fastify.get<{ Querystring: { q: string; limit?: string } }>(
    '/search',
    async (request, reply) => {
      try {
        const query = request.query.q;
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;

        if (!query) {
          return reply.code(400).send({ error: 'Query parameter "q" is required' });
        }

        // Search local albums
        const albums = await albumService.searchAlbumsLocal(query, limit);

        return reply.send({ albums });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
