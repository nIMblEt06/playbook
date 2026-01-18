import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { feedService } from '../services/feed.service.js';
import { postQuerySchema, type PostQueryInput } from '../schemas/post.schema.js';

export async function feedRoutes(fastify: FastifyInstance) {
  // GET /api/feed - Personalized feed (requires auth)
  fastify.get<{ Querystring: PostQueryInput }>(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Querystring: PostQueryInput }>, reply: FastifyReply) => {
      try {
        const query = postQuerySchema.parse(request.query);
        const result = await feedService.getFeed(request.user.userId, query);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/feed/following - Following only
  fastify.get<{ Querystring: PostQueryInput }>(
    '/following',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Querystring: PostQueryInput }>, reply: FastifyReply) => {
      try {
        const query = postQuerySchema.parse({
          ...request.query,
          filter: 'following',
        });
        const result = await feedService.getFeed(request.user.userId, query);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/feed/communities - Communities only
  fastify.get<{ Querystring: PostQueryInput }>(
    '/communities',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Querystring: PostQueryInput }>, reply: FastifyReply) => {
      try {
        const query = postQuerySchema.parse({
          ...request.query,
          filter: 'communities',
        });
        const result = await feedService.getFeed(request.user.userId, query);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/feed/new-and-upcoming - #NewAndUpcoming feed (public)
  fastify.get<{ Querystring: PostQueryInput }>(
    '/new-and-upcoming',
    async (request: FastifyRequest<{ Querystring: PostQueryInput }>, reply: FastifyReply) => {
      try {
        const query = postQuerySchema.parse(request.query);
        const result = await feedService.getNewAndUpcomingFeed(query);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/feed/activity - Activity feed (reviews/ratings from followed users)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/activity',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const page = request.query.page ? parseInt(request.query.page, 10) : 1;
        const limit = request.query.limit ? Math.min(parseInt(request.query.limit, 10), 50) : 20;
        const result = await feedService.getActivityFeed(request.user.userId, { page, limit });
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
