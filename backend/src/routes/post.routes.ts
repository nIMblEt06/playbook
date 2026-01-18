import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postService } from '../services/post.service.js';
import { commentService } from '../services/comment.service.js';
import { createPostSchema, type CreatePostInput } from '../schemas/post.schema.js';
import { createCommentSchema, type CreateCommentInput } from '../schemas/comment.schema.js';
import { paginationSchema } from '../schemas/user.schema.js';

interface PostParams {
  id: string;
}

export async function postRoutes(fastify: FastifyInstance) {
  // POST /api/posts
  fastify.post<{ Body: CreatePostInput }>(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: CreatePostInput }>, reply: FastifyReply) => {
      try {
        const input = createPostSchema.parse(request.body);
        const post = await postService.createPost(request.user.userId, input);
        return reply.code(201).send({ post });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/posts/saved - must be before /:id to avoid being matched as an ID
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/saved',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const pagination = paginationSchema.parse(request.query);
        const result = await postService.getSavedPosts(request.user.userId, pagination);
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/posts/:id
  fastify.get<{ Params: PostParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: PostParams }>, reply: FastifyReply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const post = await postService.getPostById(request.params.id, currentUserId);

        if (!post) {
          return reply.code(404).send({ error: 'Post not found' });
        }

        return reply.send({ post });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/posts/:id
  fastify.delete<{ Params: PostParams }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PostParams }>, reply: FastifyReply) => {
      try {
        await postService.deletePost(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Post not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to delete this post') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/posts/:id/upvote
  fastify.post<{ Params: PostParams }>(
    '/:id/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PostParams }>, reply: FastifyReply) => {
      try {
        await postService.upvotePost(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Post not found') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/posts/:id/upvote
  fastify.delete<{ Params: PostParams }>(
    '/:id/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PostParams }>, reply: FastifyReply) => {
      try {
        await postService.removeUpvote(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/posts/:id/save
  fastify.post<{ Params: PostParams }>(
    '/:id/save',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PostParams }>, reply: FastifyReply) => {
      try {
        await postService.savePost(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Post not found') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/posts/:id/save
  fastify.delete<{ Params: PostParams }>(
    '/:id/save',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PostParams }>, reply: FastifyReply) => {
      try {
        await postService.unsavePost(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/posts/:id/comments
  fastify.get<{ Params: PostParams; Querystring: { page?: string; limit?: string } }>(
    '/:id/comments',
    async (request, reply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const pagination = paginationSchema.parse(request.query);
        const result = await commentService.getPostComments(
          request.params.id,
          pagination,
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

  // POST /api/posts/:id/comments
  fastify.post<{ Params: PostParams; Body: CreateCommentInput }>(
    '/:id/comments',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: PostParams; Body: CreateCommentInput }>, reply: FastifyReply) => {
      try {
        const input = createCommentSchema.parse(request.body);
        const comment = await commentService.createComment(
          request.params.id,
          request.user.userId,
          input
        );
        return reply.code(201).send({ comment });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Post not found') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
