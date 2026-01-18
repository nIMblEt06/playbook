import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service.js';

/**
 * Legacy auth routes - kept for backwards compatibility
 * Main authentication is handled via /api/auth/spotify in spotify-auth.routes.ts
 */
export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/logout
  fastify.post('/logout', async (request, reply) => {
    // For JWT, logout is handled client-side by removing the token
    // In the future, we can implement token blacklisting with Redis
    return reply.send({ message: 'Logged out successfully' });
  });

  // GET /api/auth/me
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await authService.getUserById(request.user.userId);

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send({ user });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
