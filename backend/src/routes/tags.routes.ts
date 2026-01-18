import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

interface TagParams {
  slug: string;
}

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createTagSchema = z.object({
  name: z.string().min(2).max(50),
  category: z.enum(['genre', 'mood', 'era', 'custom']).default('custom'),
});

const searchTagsSchema = z.object({
  q: z.string().min(1),
  category: z.enum(['genre', 'mood', 'era', 'custom']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function tagsRoutes(fastify: FastifyInstance) {
  // GET /api/tags - Get all tags (grouped by category)
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const [genres, moods, eras, custom] = await Promise.all([
          prisma.tag.findMany({
            where: { category: 'genre' },
            orderBy: [{ isOfficial: 'desc' }, { useCount: 'desc' }, { name: 'asc' }],
          }),
          prisma.tag.findMany({
            where: { category: 'mood' },
            orderBy: [{ isOfficial: 'desc' }, { useCount: 'desc' }, { name: 'asc' }],
          }),
          prisma.tag.findMany({
            where: { category: 'era' },
            orderBy: [{ isOfficial: 'desc' }, { useCount: 'desc' }, { name: 'asc' }],
          }),
          prisma.tag.findMany({
            where: { category: 'custom' },
            orderBy: [{ useCount: 'desc' }, { name: 'asc' }],
            take: 50,
          }),
        ]);

        return reply.send({ genres, moods, eras, custom });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/tags/search - Search tags
  fastify.get<{ Querystring: z.infer<typeof searchTagsSchema> }>(
    '/search',
    async (request, reply) => {
      try {
        const query = searchTagsSchema.parse(request.query);

        const tags = await prisma.tag.findMany({
          where: {
            name: { contains: query.q, mode: 'insensitive' },
            ...(query.category ? { category: query.category } : {}),
          },
          orderBy: [{ useCount: 'desc' }, { name: 'asc' }],
          take: query.limit,
        });

        return reply.send({ tags });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/tags/:slug - Get a single tag with albums
  fastify.get<{ Params: TagParams; Querystring: z.infer<typeof paginationSchema> }>(
    '/:slug',
    async (request, reply) => {
      try {
        const query = paginationSchema.parse(request.query);
        const offset = (query.page - 1) * query.limit;

        const tag = await prisma.tag.findUnique({
          where: { slug: request.params.slug },
        });

        if (!tag) {
          return reply.code(404).send({ error: 'Tag not found' });
        }

        // Get albums with this tag
        const [albumTags, total] = await Promise.all([
          prisma.albumTag.findMany({
            where: { tagId: tag.id },
            skip: offset,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
            include: {
              album: {
                select: {
                  id: true,
                  spotifyId: true,
                  title: true,
                  artistName: true,
                  coverImageUrl: true,
                  releaseYear: true,
                  reviewCount: true,
                  ratingSum: true,
                  ratingCount: true,
                },
              },
            },
          }),
          prisma.albumTag.count({ where: { tagId: tag.id } }),
        ]);

        const albums = albumTags.map((at) => ({
          ...at.album,
          averageRating: at.album.ratingCount > 0
            ? at.album.ratingSum / at.album.ratingCount
            : null,
        }));

        return reply.send({
          tag,
          albums,
          total,
          page: query.page,
          limit: query.limit,
          hasMore: offset + albums.length < total,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/tags - Create a new custom tag
  fastify.post<{ Body: z.infer<typeof createTagSchema> }>(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const input = createTagSchema.parse(request.body);
        const slug = slugify(input.name);

        // Check if tag already exists
        const existing = await prisma.tag.findFirst({
          where: {
            OR: [
              { slug },
              { name: { equals: input.name, mode: 'insensitive' } },
            ],
          },
        });

        if (existing) {
          return reply.code(409).send({
            error: 'Tag already exists',
            tag: existing,
          });
        }

        const tag = await prisma.tag.create({
          data: {
            name: input.name,
            slug,
            category: input.category,
            isOfficial: false,
          },
        });

        return reply.code(201).send({ tag });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/tags/:slug/albums/:albumId - Add tag to album
  fastify.post<{ Params: { slug: string; albumId: string } }>(
    '/:slug/albums/:albumId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const tag = await prisma.tag.findUnique({
          where: { slug: request.params.slug },
        });

        if (!tag) {
          return reply.code(404).send({ error: 'Tag not found' });
        }

        const album = await prisma.album.findUnique({
          where: { id: request.params.albumId },
        });

        if (!album) {
          return reply.code(404).send({ error: 'Album not found' });
        }

        // Check if already tagged
        const existing = await prisma.albumTag.findUnique({
          where: {
            albumId_tagId: {
              albumId: request.params.albumId,
              tagId: tag.id,
            },
          },
        });

        if (existing) {
          return reply.code(409).send({ error: 'Album already has this tag' });
        }

        // Add tag to album
        await prisma.$transaction([
          prisma.albumTag.create({
            data: {
              albumId: request.params.albumId,
              tagId: tag.id,
              addedById: request.user.userId,
            },
          }),
          prisma.tag.update({
            where: { id: tag.id },
            data: { useCount: { increment: 1 } },
          }),
        ]);

        return reply.code(201).send({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/tags/:slug/albums/:albumId - Remove tag from album
  fastify.delete<{ Params: { slug: string; albumId: string } }>(
    '/:slug/albums/:albumId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const tag = await prisma.tag.findUnique({
          where: { slug: request.params.slug },
        });

        if (!tag) {
          return reply.code(404).send({ error: 'Tag not found' });
        }

        const albumTag = await prisma.albumTag.findUnique({
          where: {
            albumId_tagId: {
              albumId: request.params.albumId,
              tagId: tag.id,
            },
          },
        });

        if (!albumTag) {
          return reply.code(404).send({ error: 'Album does not have this tag' });
        }

        // Only the user who added the tag can remove it
        if (albumTag.addedById !== request.user.userId) {
          return reply.code(403).send({ error: 'Not authorized to remove this tag' });
        }

        await prisma.$transaction([
          prisma.albumTag.delete({
            where: { id: albumTag.id },
          }),
          prisma.tag.update({
            where: { id: tag.id },
            data: { useCount: { decrement: 1 } },
          }),
        ]);

        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/tags/category/:category - Get tags by category
  fastify.get<{ Params: { category: string } }>(
    '/category/:category',
    async (request, reply) => {
      try {
        const category = request.params.category as 'genre' | 'mood' | 'era' | 'custom';

        if (!['genre', 'mood', 'era', 'custom'].includes(category)) {
          return reply.code(400).send({ error: 'Invalid category' });
        }

        const tags = await prisma.tag.findMany({
          where: { category },
          orderBy: [{ isOfficial: 'desc' }, { useCount: 'desc' }, { name: 'asc' }],
        });

        return reply.send({ tags });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
