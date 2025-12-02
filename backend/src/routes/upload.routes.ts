import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { uploadService } from '../services/upload.service.js';
import { z } from 'zod';

const uploadImageSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
});

type UploadImageInput = z.infer<typeof uploadImageSchema>;

export async function uploadRoutes(fastify: FastifyInstance) {
  // POST /api/upload/image
  fastify.post<{ Body: UploadImageInput }>(
    '/image',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Body: UploadImageInput }>, reply: FastifyReply) => {
      try {
        const { image } = uploadImageSchema.parse(request.body);
        
        // Check if it's a base64 image or URL
        let imageUrl: string;
        
        if (image.startsWith('data:image/')) {
          // Base64 image - save it
          imageUrl = await uploadService.saveBase64Image(image);
          // Convert to full URL
          const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
          imageUrl = `${baseUrl}${imageUrl}`;
        } else if (image.startsWith('http://') || image.startsWith('https://')) {
          // External URL - use as-is
          imageUrl = await uploadService.saveImageFromUrl(image);
        } else {
          return reply.code(400).send({ error: 'Invalid image format' });
        }

        return reply.send({ url: imageUrl });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}

