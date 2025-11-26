import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service.js';
import { updateUserSchema, paginationSchema, type UpdateUserInput } from '../schemas/user.schema.js';

interface UserParams {
  username: string;
}

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/:username
  fastify.get<{ Params: UserParams }>(
    '/:username',
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        // Get current user ID if authenticated
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated, that's fine
        }

        const user = await userService.getUserByUsername(request.params.username, currentUserId);

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

  // PATCH /api/users/:username
  fastify.patch<{ Params: UserParams; Body: UpdateUserInput }>(
    '/:username',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: UserParams; Body: UpdateUserInput }>, reply: FastifyReply) => {
      try {
        // Verify user is updating their own profile
        if (request.params.username.toLowerCase() !== request.user.username.toLowerCase()) {
          return reply.code(403).send({ error: 'Not authorized to update this profile' });
        }

        const input = updateUserSchema.parse(request.body);
        const user = await userService.updateUser(request.user.userId, input);

        return reply.send({ user });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/users/:username/posts
  fastify.get<{ Params: UserParams; Querystring: { page?: string; limit?: string } }>(
    '/:username/posts',
    async (request, reply) => {
      try {
        const pagination = paginationSchema.parse(request.query);
        const result = await userService.getUserPosts(request.params.username, pagination);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/users/:username/followers
  fastify.get<{ Params: UserParams; Querystring: { page?: string; limit?: string } }>(
    '/:username/followers',
    async (request, reply) => {
      try {
        const user = await userService.getUserByUsername(request.params.username);
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const pagination = paginationSchema.parse(request.query);
        const result = await userService.getFollowers(user.id, pagination);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/users/:username/following
  fastify.get<{ Params: UserParams; Querystring: { page?: string; limit?: string } }>(
    '/:username/following',
    async (request, reply) => {
      try {
        const user = await userService.getUserByUsername(request.params.username);
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const pagination = paginationSchema.parse(request.query);
        const result = await userService.getFollowing(user.id, pagination);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/users/:username/follow
  fastify.post<{ Params: UserParams }>(
    '/:username/follow',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        const targetUser = await userService.getUserByUsername(request.params.username);
        if (!targetUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        await userService.followUser(request.user.userId, targetUser.id);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/users/:username/follow
  fastify.delete<{ Params: UserParams }>(
    '/:username/follow',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        const targetUser = await userService.getUserByUsername(request.params.username);
        if (!targetUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        await userService.unfollowUser(request.user.userId, targetUser.id);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
