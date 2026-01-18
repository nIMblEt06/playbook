import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as reviewService from '../services/review.service.js';
import { z } from 'zod';

interface ReviewParams {
  reviewId: string;
}

interface CommentParams {
  commentId: string;
}

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const commentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(['recent', 'engaged']).default('recent'),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export async function reviewRoutes(fastify: FastifyInstance) {
  // GET /api/reviews/:reviewId - Get a single review by ID
  fastify.get<{ Params: ReviewParams }>(
    '/:reviewId',
    async (request: FastifyRequest<{ Params: ReviewParams }>, reply: FastifyReply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const review = await reviewService.getReviewById(
          request.params.reviewId,
          currentUserId
        );

        if (!review) {
          return reply.code(404).send({ error: 'Review not found' });
        }

        return reply.send({ review });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/reviews/:reviewId - Delete a review
  fastify.delete<{ Params: ReviewParams }>(
    '/:reviewId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: ReviewParams }>, reply: FastifyReply) => {
      try {
        await reviewService.deleteReview(request.params.reviewId, request.user.userId);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Review not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to delete this review') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/reviews/:reviewId/upvote - Upvote a review
  fastify.post<{ Params: ReviewParams }>(
    '/:reviewId/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: ReviewParams }>, reply: FastifyReply) => {
      try {
        await reviewService.upvoteReview(request.params.reviewId, request.user.userId);
        return reply.code(201).send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Already upvoted') {
            return reply.code(409).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/reviews/:reviewId/upvote - Remove upvote from a review
  fastify.delete<{ Params: ReviewParams }>(
    '/:reviewId/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: ReviewParams }>, reply: FastifyReply) => {
      try {
        await reviewService.removeReviewUpvote(request.params.reviewId, request.user.userId);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not upvoted') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/reviews/:reviewId/comments - Get comments for a review
  fastify.get<{ Params: ReviewParams; Querystring: z.infer<typeof commentQuerySchema> }>(
    '/:reviewId/comments',
    async (request, reply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        const query = commentQuerySchema.parse(request.query);

        const result = await reviewService.getReviewComments(
          request.params.reviewId,
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

  // POST /api/reviews/:reviewId/comments - Create a comment on a review
  fastify.post<{ Params: ReviewParams; Body: z.infer<typeof createCommentSchema> }>(
    '/:reviewId/comments',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const input = createCommentSchema.parse(request.body);

        const comment = await reviewService.createComment({
          reviewId: request.params.reviewId,
          authorId: request.user.userId,
          content: input.content,
          parentId: input.parentId,
        });

        return reply.code(201).send({ comment });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/reviews/comments/:commentId - Delete a comment
  fastify.delete<{ Params: CommentParams }>(
    '/comments/:commentId',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommentParams }>, reply: FastifyReply) => {
      try {
        await reviewService.deleteComment(request.params.commentId, request.user.userId);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Comment not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized to delete this comment') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/reviews/comments/:commentId/upvote - Upvote a comment
  fastify.post<{ Params: CommentParams }>(
    '/comments/:commentId/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommentParams }>, reply: FastifyReply) => {
      try {
        await reviewService.upvoteComment(request.params.commentId, request.user.userId);
        return reply.code(201).send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Already upvoted') {
            return reply.code(409).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/reviews/comments/:commentId/upvote - Remove upvote from a comment
  fastify.delete<{ Params: CommentParams }>(
    '/comments/:commentId/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommentParams }>, reply: FastifyReply) => {
      try {
        await reviewService.removeCommentUpvote(request.params.commentId, request.user.userId);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Not upvoted') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/reviews/popular - Get popular reviews
  fastify.get<{ Querystring: { timeframe?: string; limit?: string } }>(
    '/popular',
    async (request, reply) => {
      try {
        const timeframe = (request.query.timeframe || 'week') as 'day' | 'week' | 'month';
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

        const reviews = await reviewService.getPopularReviews(timeframe, limit);

        return reply.send({ reviews });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
