import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { searchService } from '../services/search.service.js';
import { paginationSchema } from '../schemas/user.schema.js';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.enum(['users', 'communities', 'posts']).default('users'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function searchRoutes(fastify: FastifyInstance) {
  // GET /api/search?q=<query>&type=<users|communities|posts>
  fastify.get<{
    Querystring: { q: string; type?: string; page?: string; limit?: string };
  }>('/', async (request, reply) => {
    try {
      const params = searchQuerySchema.parse(request.query);
      const pagination = { page: params.page, limit: params.limit };
      const result = await searchService.search(params.q, params.type, pagination);
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });
}
