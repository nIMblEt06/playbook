import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../services/notification.service.js';
import { paginationSchema } from '../schemas/user.schema.js';

interface NotificationParams {
  id: string;
}

export async function notificationRoutes(fastify: FastifyInstance) {
  // All notification routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/notifications
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/',
    async (request, reply) => {
      try {
        const pagination = paginationSchema.parse(request.query);
        const result = await notificationService.getNotifications(
          request.user.userId,
          pagination
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

  // GET /api/notifications/unread-count
  fastify.get('/unread-count', async (request, reply) => {
    try {
      const result = await notificationService.getUnreadCount(request.user.userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // PATCH /api/notifications/:id/read
  fastify.patch<{ Params: NotificationParams }>(
    '/:id/read',
    async (request: FastifyRequest<{ Params: NotificationParams }>, reply: FastifyReply) => {
      try {
        await notificationService.markAsRead(request.params.id, request.user.userId);
        return reply.send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Notification not found') {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message === 'Not authorized') {
            return reply.code(403).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/notifications/read-all
  fastify.post('/read-all', async (request, reply) => {
    try {
      await notificationService.markAllAsRead(request.user.userId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });
}
