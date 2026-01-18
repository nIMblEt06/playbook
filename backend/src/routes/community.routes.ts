import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { communityService } from '../services/community.service.js';
import { feedService } from '../services/feed.service.js';
import { createCommunitySchema, updateCommunitySchema, type CreateCommunityInput, type UpdateCommunityInput } from '../schemas/community.schema.js';
import { paginationSchema } from '../schemas/user.schema.js';
import { postQuerySchema } from '../schemas/post.schema.js';

interface CommunityParams {
  slug: string;
}

export async function communityRoutes(fastify: FastifyInstance) {
  // GET /api/communities
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/',
    async (request, reply) => {
      try {
        const pagination = paginationSchema.parse(request.query);
        const result = await communityService.listCommunities(pagination);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/communities
  fastify.post<{ Body: CreateCommunityInput }>(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: CreateCommunityInput }>, reply: FastifyReply) => {
      try {
        const input = createCommunitySchema.parse(request.body);
        const community = await communityService.createCommunity(request.user.userId, input);
        return reply.code(201).send({ community });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Community slug already taken') {
            return reply.code(409).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/communities/:slug
  fastify.get<{ Params: CommunityParams }>(
    '/:slug',
    async (request: FastifyRequest<{ Params: CommunityParams }>, reply: FastifyReply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const community = await communityService.getCommunityBySlug(
          request.params.slug,
          currentUserId
        );

        if (!community) {
          return reply.code(404).send({ error: 'Community not found' });
        }

        return reply.send({ community });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // PATCH /api/communities/:slug
  fastify.patch<{ Params: CommunityParams; Body: UpdateCommunityInput }>(
    '/:slug',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommunityParams; Body: UpdateCommunityInput }>, reply: FastifyReply) => {
      try {
        const community = await communityService.getCommunityBySlug(request.params.slug);
        if (!community) {
          return reply.code(404).send({ error: 'Community not found' });
        }

        const input = updateCommunitySchema.parse(request.body);
        const updated = await communityService.updateCommunity(
          community.id,
          request.user.userId,
          input
        );
        return reply.send({ community: updated });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not authorized to update this community') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/communities/:slug/posts
  fastify.get<{ Params: CommunityParams; Querystring: { page?: string; limit?: string; sort?: string } }>(
    '/:slug/posts',
    async (request, reply) => {
      try {
        const community = await communityService.getCommunityBySlug(request.params.slug);
        if (!community) {
          return reply.code(404).send({ error: 'Community not found' });
        }

        const query = postQuerySchema.parse(request.query);
        const result = await feedService.getCommunityFeed(community.id, query);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/communities/:slug/members
  fastify.get<{ Params: CommunityParams; Querystring: { page?: string; limit?: string } }>(
    '/:slug/members',
    async (request, reply) => {
      try {
        const community = await communityService.getCommunityBySlug(request.params.slug);
        if (!community) {
          return reply.code(404).send({ error: 'Community not found' });
        }

        const pagination = paginationSchema.parse(request.query);
        const result = await communityService.getCommunityMembers(community.id, pagination);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/communities/:slug/join
  fastify.post<{ Params: CommunityParams }>(
    '/:slug/join',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommunityParams }>, reply: FastifyReply) => {
      try {
        const community = await communityService.getCommunityBySlug(request.params.slug);
        if (!community) {
          return reply.code(404).send({ error: 'Community not found' });
        }

        await communityService.joinCommunity(community.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/communities/:slug/leave
  fastify.delete<{ Params: CommunityParams }>(
    '/:slug/leave',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommunityParams }>, reply: FastifyReply) => {
      try {
        const community = await communityService.getCommunityBySlug(request.params.slug);
        if (!community) {
          return reply.code(404).send({ error: 'Community not found' });
        }

        await communityService.leaveCommunity(community.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Creator cannot leave the community') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
