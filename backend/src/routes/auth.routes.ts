import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from '../schemas/auth.schema.js';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post<{ Body: RegisterInput }>(
    '/register',
    async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      try {
        const input = registerSchema.parse(request.body);
        const user = await authService.register(input);

        const token = fastify.jwt.sign({
          userId: user.id,
          username: user.username,
        });

        return reply.code(201).send({
          user,
          token,
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('already')) {
            return reply.code(409).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/auth/login
  fastify.post<{ Body: LoginInput }>(
    '/login',
    async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      try {
        const input = loginSchema.parse(request.body);
        const user = await authService.login(input);

        const token = fastify.jwt.sign({
          userId: user.id,
          username: user.username,
        });

        return reply.send({
          user,
          token,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(401).send({ error: error.message });
        }
        throw error;
      }
    }
  );

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
