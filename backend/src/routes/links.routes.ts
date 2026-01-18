import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as linkParserService from '../services/link-parser.service.js';
import { z } from 'zod';

const parseUrlSchema = z.object({
  url: z.string().url(),
});

const detectUrlsSchema = z.object({
  text: z.string().min(1).max(5000),
});

export async function linksRoutes(fastify: FastifyInstance) {
  // POST /api/links/parse - Parse a music URL
  fastify.post<{ Body: z.infer<typeof parseUrlSchema> }>(
    '/parse',
    async (request: FastifyRequest<{ Body: z.infer<typeof parseUrlSchema> }>, reply: FastifyReply) => {
      try {
        const input = parseUrlSchema.parse(request.body);
        const parsed = linkParserService.parseUrl(input.url);

        if (parsed.type === 'unknown') {
          return reply.code(400).send({
            error: 'Unsupported URL',
            message: 'Could not recognize this as a supported music streaming URL',
          });
        }

        return reply.send({ link: parsed });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/links/detect - Detect music URLs in text
  fastify.post<{ Body: z.infer<typeof detectUrlsSchema> }>(
    '/detect',
    async (request: FastifyRequest<{ Body: z.infer<typeof detectUrlsSchema> }>, reply: FastifyReply) => {
      try {
        const input = detectUrlsSchema.parse(request.body);
        const links = linkParserService.detectMusicUrl(input.text);

        return reply.send({ links });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // POST /api/links/metadata - Fetch metadata for a music URL
  fastify.post<{ Body: z.infer<typeof parseUrlSchema> }>(
    '/metadata',
    async (request: FastifyRequest<{ Body: z.infer<typeof parseUrlSchema> }>, reply: FastifyReply) => {
      try {
        const input = parseUrlSchema.parse(request.body);

        // First parse the URL
        const parsed = linkParserService.parseUrl(input.url);
        if (parsed.type === 'unknown') {
          return reply.code(400).send({
            error: 'Unsupported URL',
            message: 'Could not recognize this as a supported music streaming URL',
          });
        }

        // Then fetch metadata (pass the URL string)
        const metadata = await linkParserService.fetchLinkMetadata(input.url);

        return reply.send({ metadata });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/links/validate - Check if a URL is a valid music URL
  fastify.get<{ Querystring: { url: string } }>(
    '/validate',
    async (request, reply) => {
      try {
        const url = request.query.url;

        if (!url) {
          return reply.code(400).send({ error: 'URL is required' });
        }

        const isValid = linkParserService.isValidMusicUrl(url);
        const parsed = isValid ? linkParserService.parseUrl(url) : null;

        return reply.send({
          valid: isValid,
          source: parsed?.source || null,
          type: parsed?.type || null,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/links/supported-sources - Get list of supported music sources
  fastify.get(
    '/supported-sources',
    async (request, reply) => {
      return reply.send({
        sources: [
          {
            id: 'spotify',
            name: 'Spotify',
            types: ['track', 'album', 'playlist', 'artist'],
            urlPatterns: ['open.spotify.com/*', 'spotify.link/*'],
          },
          {
            id: 'apple_music',
            name: 'Apple Music',
            types: ['track', 'album', 'playlist', 'artist'],
            urlPatterns: ['music.apple.com/*'],
          },
          {
            id: 'youtube_music',
            name: 'YouTube Music',
            types: ['track', 'album', 'playlist'],
            urlPatterns: ['music.youtube.com/*'],
          },
          {
            id: 'soundcloud',
            name: 'SoundCloud',
            types: ['track', 'playlist', 'artist'],
            urlPatterns: ['soundcloud.com/*'],
          },
          {
            id: 'bandcamp',
            name: 'Bandcamp',
            types: ['track', 'album', 'artist'],
            urlPatterns: ['*.bandcamp.com/*'],
          },
        ],
      });
    }
  );
}
