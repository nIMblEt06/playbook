import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

export class UploadService {
  private uploadDir = join(process.cwd(), 'uploads');

  async saveBase64Image(base64Data: string): Promise<string> {
    // Extract the base64 data and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data');
    }

    const mimeType = matches[1];
    const base64Content = matches[2];

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Get file extension
    const extension = mimeType.split('/')[1];
    
    // Generate unique filename
    const filename = `${randomBytes(16).toString('hex')}.${extension}`;
    const filepath = join(this.uploadDir, filename);

    // Ensure upload directory exists
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }

    await writeFile(filepath, buffer);

    // Return URL path (relative to server)
    return `/uploads/${filename}`;
  }

  async saveImageFromUrl(url: string): Promise<string> {
    // For external URLs, we can either:
    // 1. Store the URL directly (current approach)
    // 2. Download and re-host the image
    // For now, just return the URL as-is
    return url;
  }
}

export const uploadService = new UploadService();

