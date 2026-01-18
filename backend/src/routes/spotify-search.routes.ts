import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as spotifySearchService from '../services/spotify-search.service.js';

interface SearchQuery {
  q: string;
  page?: string;
  limit?: string;
}

interface AlbumParams {
  albumId: string;
}

export async function spotifySearchRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/spotify/search/tracks
   * Search for tracks on Spotify
   */
  fastify.get<{ Querystring: SearchQuery }>(
    '/search/tracks',
    async (request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) => {
      const { q, page = '1', limit = '10' } = request.query;

      if (!q || !q.trim()) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' });
      }

      try {
        const userId = (request.user as { userId?: string })?.userId;
        const result = await spotifySearchService.searchTracks(
          q.trim(),
          parseInt(page, 10),
          parseInt(limit, 10),
          userId
        );
        return result;
      } catch (error) {
        console.error('Track search error:', error);
        return reply.status(500).send({ error: 'Failed to search tracks' });
      }
    }
  );

  /**
   * GET /api/spotify/search/albums
   * Search for albums on Spotify
   */
  fastify.get<{ Querystring: SearchQuery }>(
    '/search/albums',
    async (request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) => {
      const { q, page = '1', limit = '10' } = request.query;

      if (!q || !q.trim()) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' });
      }

      try {
        const userId = (request.user as { userId?: string })?.userId;
        const result = await spotifySearchService.searchAlbums(
          q.trim(),
          parseInt(page, 10),
          parseInt(limit, 10),
          userId
        );
        return result;
      } catch (error) {
        console.error('Album search error:', error);
        return reply.status(500).send({ error: 'Failed to search albums' });
      }
    }
  );

  /**
   * GET /api/spotify/search/artists
   * Search for artists on Spotify
   */
  fastify.get<{ Querystring: SearchQuery }>(
    '/search/artists',
    async (request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) => {
      const { q, page = '1', limit = '10' } = request.query;

      if (!q || !q.trim()) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' });
      }

      try {
        const userId = (request.user as { userId?: string })?.userId;
        const result = await spotifySearchService.searchArtists(
          q.trim(),
          parseInt(page, 10),
          parseInt(limit, 10),
          userId
        );
        return result;
      } catch (error) {
        console.error('Artist search error:', error);
        return reply.status(500).send({ error: 'Failed to search artists' });
      }
    }
  );

  /**
   * GET /api/spotify/albums/:albumId/tracks
   * Get tracks from a specific album
   */
  fastify.get<{ Params: AlbumParams }>(
    '/albums/:albumId/tracks',
    async (request: FastifyRequest<{ Params: AlbumParams }>, reply: FastifyReply) => {
      const { albumId } = request.params;

      if (!albumId) {
        return reply.status(400).send({ error: 'Album ID is required' });
      }

      try {
        const userId = (request.user as { userId?: string })?.userId;
        const tracks = await spotifySearchService.getAlbumTracks(albumId, userId);
        return { tracks };
      } catch (error) {
        console.error('Get album tracks error:', error);
        return reply.status(500).send({ error: 'Failed to get album tracks' });
      }
    }
  );

  /**
   * GET /api/spotify/tracks/:trackId
   * Get a single track by ID
   */
  fastify.get<{ Params: { trackId: string } }>(
    '/tracks/:trackId',
    async (request: FastifyRequest<{ Params: { trackId: string } }>, reply: FastifyReply) => {
      const { trackId } = request.params;

      try {
        const userId = (request.user as { userId?: string })?.userId;
        const track = await spotifySearchService.getTrack(trackId, userId);

        if (!track) {
          return reply.status(404).send({ error: 'Track not found' });
        }

        return track;
      } catch (error) {
        console.error('Get track error:', error);
        return reply.status(500).send({ error: 'Failed to get track' });
      }
    }
  );

  /**
   * GET /api/spotify/albums/:albumId
   * Get a single album by ID
   */
  fastify.get<{ Params: AlbumParams }>(
    '/albums/:albumId',
    async (request: FastifyRequest<{ Params: AlbumParams }>, reply: FastifyReply) => {
      const { albumId } = request.params;

      try {
        const userId = (request.user as { userId?: string })?.userId;
        const album = await spotifySearchService.getAlbum(albumId, userId);

        if (!album) {
          return reply.status(404).send({ error: 'Album not found' });
        }

        return album;
      } catch (error) {
        console.error('Get album error:', error);
        return reply.status(500).send({ error: 'Failed to get album' });
      }
    }
  );
}
