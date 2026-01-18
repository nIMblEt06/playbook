import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as discoverService from '../services/discover.service.js';
import * as reviewService from '../services/review.service.js';
import { z } from 'zod';

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const popularReviewsSchema = z.object({
  timeframe: z.enum(['day', 'week', 'month']).default('week'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const reviewsPaginatedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function discoverRoutes(fastify: FastifyInstance) {
  // GET /api/discover - Get all homepage data
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        let userId: string | undefined;
        try {
          await request.jwtVerify();
          userId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const data = await discoverService.getHomepageData(userId);

        return reply.send(data);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/new-releases - Get new music releases
  fastify.get<{ Querystring: z.infer<typeof paginationSchema> }>(
    '/new-releases',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const releases = await discoverService.getNewReleases(query.limit);

        return reply.send({ releases });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/recently-logged - Get recently logged albums on the platform
  fastify.get<{ Querystring: z.infer<typeof paginationSchema> }>(
    '/recently-logged',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const albums = await discoverService.getRecentlyLoggedAlbums(query.limit);

        return reply.send({ albums });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/popular-reviews - Get popular reviews
  fastify.get<{ Querystring: z.infer<typeof popularReviewsSchema> }>(
    '/popular-reviews',
    async (request, reply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const query = popularReviewsSchema.parse(request.query);
        const reviews = await discoverService.getPopularReviews(query.timeframe, query.limit, currentUserId);

        return reply.send({ reviews });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/trending - Get trending albums
  fastify.get<{ Querystring: z.infer<typeof paginationSchema> }>(
    '/trending',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const albums = await discoverService.getTrendingAlbums(query.limit);

        return reply.send({ albums });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/friends-activity - Get activity from followed users
  fastify.get<{ Querystring: z.infer<typeof paginationSchema> }>(
    '/friends-activity',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const activity = await discoverService.getFriendsActivity(
          request.user.userId,
          query.limit
        );

        return reply.send({ activity });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/community-activity - Get activity from joined communities
  fastify.get<{ Querystring: z.infer<typeof paginationSchema> }>(
    '/community-activity',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const activity = await discoverService.getCommunityActivity(
          request.user.userId,
          query.limit
        );

        return reply.send({ activity });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/reviews - Get all reviews paginated, ordered by upvotes desc
  fastify.get<{ Querystring: z.infer<typeof reviewsPaginatedSchema> }>(
    '/reviews',
    async (request, reply) => {
      try {
        const query = reviewsPaginatedSchema.parse(request.query);
        const result = await reviewService.getAllReviewsPaginated(query.page, query.limit);

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/discover/popular-tags - Get popular tags
  fastify.get<{ Querystring: z.infer<typeof paginationSchema> }>(
    '/popular-tags',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const tags = await discoverService.getPopularTags(query.limit);

        return reply.send({ tags });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
