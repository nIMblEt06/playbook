import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { commentService } from '../services/comment.service.js';

interface CommentParams {
  id: string;
}

export async function commentRoutes(fastify: FastifyInstance) {
  // DELETE /api/comments/:id
  fastify.delete<{ Params: CommentParams }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommentParams }>, reply: FastifyReply) => {
      try {
        await commentService.deleteComment(request.params.id, request.user.userId);
        return reply.send({ success: true });
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

  // POST /api/comments/:id/upvote
  fastify.post<{ Params: CommentParams }>(
    '/:id/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommentParams }>, reply: FastifyReply) => {
      try {
        await commentService.upvoteComment(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Comment not found') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/comments/:id/upvote
  fastify.delete<{ Params: CommentParams }>(
    '/:id/upvote',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: CommentParams }>, reply: FastifyReply) => {
      try {
        await commentService.removeCommentUpvote(request.params.id, request.user.userId);
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
