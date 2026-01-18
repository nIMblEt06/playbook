import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as artistService from '../services/artist.service.js';
import * as reviewService from '../services/review.service.js';
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

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional().nullable(),
  content: z.string().max(5000).optional().nullable(),
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

  // POST /api/artists/:spotifyId/reviews - Create or update review for artist
  fastify.post<{ Params: ArtistParams; Body: z.infer<typeof createReviewSchema> }>(
    '/:spotifyId/reviews',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const input = createReviewSchema.parse(request.body);

        // First get the artist
        const artist = await artistService.getOrCreateArtist(request.params.spotifyId);
        if (!artist) {
          return reply.code(404).send({ error: 'Artist not found' });
        }

        const review = await reviewService.createOrUpdateReview({
          authorId: request.user.userId,
          targetType: 'artist',
          artistId: artist.id,
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
