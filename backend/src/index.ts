import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { prisma } from './utils/prisma.js';
import { connectRedis } from './utils/redis.js';
import { setupAuthMiddleware } from './middleware/auth.middleware.js';

// Routes
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { postRoutes } from './routes/post.routes.js';
import { communityRoutes } from './routes/community.routes.js';
import { feedRoutes } from './routes/feed.routes.js';
import { commentRoutes } from './routes/comment.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { playlistRoutes } from './routes/playlist.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { albumRoutes } from './routes/album.routes.js';
import { artistRoutes } from './routes/artist.routes.js';
import { reviewRoutes } from './routes/review.routes.js';
import { discoverRoutes } from './routes/discover.routes.js';
import { tagsRoutes } from './routes/tags.routes.js';
import { linksRoutes } from './routes/links.routes.js';
import { spotifyAuthRoutes } from './routes/spotify-auth.routes.js';
import { spotifySearchRoutes } from './routes/spotify-search.routes.js';
import { playbackRoutes } from './routes/playback.routes.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'https://www.trackd.site', 'https://trackd.site', 'https://www.trackd.site']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(jwt, {
    secret: JWT_SECRET,
    sign: {
      expiresIn: '7d',
    },
  });

  await fastify.register(cookie);

  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  });

  // Serve static files (uploads)
  await fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  // Setup authentication middleware
  setupAuthMiddleware(fastify);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API info
  fastify.get('/api', async () => {
    return {
      name: 'Trackd API',
      version: '1.0.0',
      description: 'Music-focused social platform API',
    };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(postRoutes, { prefix: '/api/posts' });
  await fastify.register(communityRoutes, { prefix: '/api/communities' });
  await fastify.register(feedRoutes, { prefix: '/api/feed' });
  await fastify.register(commentRoutes, { prefix: '/api/comments' });
  await fastify.register(notificationRoutes, { prefix: '/api/notifications' });
  await fastify.register(searchRoutes, { prefix: '/api/search' });
  await fastify.register(playlistRoutes, { prefix: '/api/playlists' });
  await fastify.register(uploadRoutes, { prefix: '/api/upload' });
  await fastify.register(albumRoutes, { prefix: '/api/albums' });
  await fastify.register(artistRoutes, { prefix: '/api/artists' });
  await fastify.register(reviewRoutes, { prefix: '/api/reviews' });
  await fastify.register(discoverRoutes, { prefix: '/api/discover' });
  await fastify.register(tagsRoutes, { prefix: '/api/tags' });
  await fastify.register(linksRoutes, { prefix: '/api/links' });

  // Spotify OAuth routes (no prefix - routes define their own paths)
  await fastify.register(spotifyAuthRoutes);

  // Spotify search routes
  await fastify.register(spotifySearchRoutes, { prefix: '/api/spotify' });

  // Spotify playback routes
  await fastify.register(playbackRoutes, { prefix: '/api/playback' });

  // Global error handler
  fastify.setErrorHandler((error: Error & { validation?: unknown; statusCode?: number }, request, reply) => {
    fastify.log.error(error);

    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: error.validation,
      });
    }

    if (error.statusCode === 429) {
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }

    return reply.code(error.statusCode || 500).send({
      error: error.message || 'Internal Server Error',
    });
  });

  return fastify;
}

async function start() {
  try {
    // Connect to Redis (optional, will continue without if unavailable)
    await connectRedis().catch((err) => {
      console.warn('Redis connection failed, continuing without cache:', err.message);
    });

    // Test database connection
    await prisma.$connect();
    console.log('Connected to PostgreSQL database');

    const server = await buildServer();

    await server.listen({ port: PORT, host: HOST });
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log(`API docs: http://${HOST}:${PORT}/api`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
