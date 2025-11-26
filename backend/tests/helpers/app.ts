import Fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { setupAuthMiddleware } from '../../src/middleware/auth.middleware.js';
import { authRoutes } from '../../src/routes/auth.routes.js';
import { userRoutes } from '../../src/routes/user.routes.js';
import { postRoutes } from '../../src/routes/post.routes.js';
import { communityRoutes } from '../../src/routes/community.routes.js';
import { feedRoutes } from '../../src/routes/feed.routes.js';
import { commentRoutes } from '../../src/routes/comment.routes.js';
import { notificationRoutes } from '../../src/routes/notification.routes.js';
import { searchRoutes } from '../../src/routes/search.routes.js';
import { playlistRoutes } from '../../src/routes/playlist.routes.js';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: 'test-jwt-secret-minimum-32-characters-long',
    sign: { expiresIn: '7d' },
  });
  await app.register(cookie);

  setupAuthMiddleware(app);

  // Register all routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(postRoutes, { prefix: '/api/posts' });
  await app.register(communityRoutes, { prefix: '/api/communities' });
  await app.register(feedRoutes, { prefix: '/api/feed' });
  await app.register(commentRoutes, { prefix: '/api/comments' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(searchRoutes, { prefix: '/api/search' });
  await app.register(playlistRoutes, { prefix: '/api/playlists' });

  return app;
}

export function generateTestToken(app: FastifyInstance, payload: { userId: string; username: string }): string {
  return app.jwt.sign(payload);
}
