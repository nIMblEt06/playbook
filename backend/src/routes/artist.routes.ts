import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as artistService from '../services/artist.service.js';
import * as reviewService from '../services/review.service.js';
import * as spotifySearchService from '../services/spotify-search.service.js';
import { z } from 'zod';

interface ArtistParams {
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

export async function artistRoutes(fastify: FastifyInstance) {
  // GET /api/artists/:spotifyId - Get artist by Spotify ID
  fastify.get<{ Params: ArtistParams }>(
    '/:spotifyId',
    async (request: FastifyRequest<{ Params: ArtistParams }>, reply: FastifyReply) => {
      try {
        const artist = await artistService.getArtistBySpotifyId(request.params.spotifyId);

        if (!artist) {
          return reply.code(404).send({ error: 'Artist not found' });
        }

        return reply.send({ artist });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/artists/:spotifyId/albums - Get artist's discography (local albums)
  fastify.get<{ Params: ArtistParams; Querystring: z.infer<typeof paginationSchema> }>(
    '/:spotifyId/albums',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);

        // First get the artist
        const artist = await artistService.getOrCreateArtist(request.params.spotifyId);
        if (!artist) {
          return reply.code(404).send({ error: 'Artist not found' });
        }

        const result = await artistService.getArtistDiscography(
          artist.id,
          query.page,
          query.limit
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

  // GET /api/artists/:spotifyId/discography - Get artist's discography from Spotify
  fastify.get<{ Params: ArtistParams; Querystring: z.infer<typeof paginationSchema> }>(
    '/:spotifyId/discography',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const offset = (query.page - 1) * query.limit;

        // Fetch albums directly from Spotify
        const result = await spotifySearchService.getArtistAlbums(
          request.params.spotifyId,
          query.limit,
          offset
        );

        // Transform to match frontend expected format
        const items = result.items.map((album) => ({
          id: album.id,
          title: album.name,
          'primary-type': album.album_type,
          'first-release-date': album.release_date,
          coverArtUrl: album.images[0]?.url || null,
        }));

        return reply.send({
          items,
          total: result.total,
          offset,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/artists/:spotifyId/reviews - Get reviews for artist
  fastify.get<{ Params: ArtistParams; Querystring: z.infer<typeof reviewQuerySchema> }>(
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

        // First get the artist
        const artist = await artistService.getOrCreateArtist(request.params.spotifyId);
        if (!artist) {
          return reply.code(404).send({ error: 'Artist not found' });
        }

        const result = await reviewService.getArtistReviews(
          artist.id,
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

  // NOTE: Direct artist ratings/reviews are disabled
  // Artist ratings are aggregated from their album ratings

  // GET /api/artists/search - Search artists locally
  fastify.get<{ Querystring: { q: string; limit?: string } }>(
    '/search',
    async (request, reply) => {
      try {
        const query = request.query.q;
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;

        if (!query) {
          return reply.code(400).send({ error: 'Query parameter "q" is required' });
        }

        // Search local artists
        const artists = await artistService.searchArtistsLocal(query, limit);

        return reply.send({ artists });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
