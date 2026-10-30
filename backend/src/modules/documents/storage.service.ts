import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/errorHandler.js';

export interface UploadedFileResult {
  storageKey: string;
  originalFilename: string;
  verifiedMimeType: string;
  fileSize: number;
}

export class StorageService {
  private localDir: string;

  constructor() {
    this.localDir = path.resolve(env.STORAGE_LOCAL_DIR);
    if (env.STORAGE_DRIVER === 'local') {
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
    }
  }

  /**
   * Validates file format and size, then writes securely to private storage
   */
  public async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    providedMimeType: string
  ): Promise<UploadedFileResult> {
    const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
    const allowedExtensions = ['pdf', 'docx', 'pptx', 'png', 'jpg', 'jpeg'];

    if (!allowedExtensions.includes(ext)) {
      throw new AppError(
        `File extension .${ext} is not supported. Allowed formats: ${allowedExtensions.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // Maximum file size check: 50MB
    const maxSizeBytes = 50 * 1024 * 1024;
    if (fileBuffer.length > maxSizeBytes) {
      throw new AppError('File size exceeds maximum allowed threshold of 50 MB.', 400, 'FILE_TOO_LARGE');
    }

    // Sanitize filename and create unique storage object key
    const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const randomHash = crypto.randomBytes(16).toString('hex');
    const storageKey = `documents/${Date.now()}-${randomHash}-${sanitizedName}`;

    if (env.STORAGE_DRIVER === 'supabase' && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      // Supabase Storage implementation
      try {
        const uploadUrl = `${env.SUPABASE_URL}/storage/v1/object/${env.SUPABASE_BUCKET}/${storageKey}`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': providedMimeType,
          },
          body: fileBuffer,
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Supabase upload failed: ${response.status} - ${errBody}`);
        }
      } catch (err: any) {
        logger.error({ err }, 'Supabase Storage upload error');
        throw new AppError('Private storage service failed to store object.', 502, 'STORAGE_UPLOAD_FAILED');
      }
    } else {
      // Local private storage directory
      const targetPath = path.join(this.localDir, storageKey.replace('documents/', ''));
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, fileBuffer);
    }

    return {
      storageKey,
      originalFilename: sanitizedName,
      verifiedMimeType: providedMimeType,
      fileSize: fileBuffer.length,
    };
  }

  /**
   * Generates a short-lived download URL or temporary access token for authorized printing
   */
  public getSignedDownloadUrl(storageKey: string, expiresInSeconds = 300): string {
    const timestamp = Date.now() + expiresInSeconds * 1000;
    const signature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${storageKey}:${timestamp}`)
      .digest('hex');

    return `/api/v1/documents/download?key=${encodeURIComponent(storageKey)}&expires=${timestamp}&sig=${signature}`;
  }

  /**
   * Verifies the download signature
   */
  public verifyDownloadSignature(storageKey: string, expires: number, signature: string): boolean {
    if (Date.now() > expires) {
      return false;
    }
    const expected = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${storageKey}:${expires}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
  }

  /**
   * Reads raw buffer from storage
   */
  public async getFileBuffer(storageKey: string): Promise<Buffer> {
    if (env.STORAGE_DRIVER === 'supabase' && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      const downloadUrl = `${env.SUPABASE_URL}/storage/v1/object/authenticated/${env.SUPABASE_BUCKET}/${storageKey}`;
      const res = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      });
      if (!res.ok) throw new AppError('Document not found in cloud storage.', 404, 'FILE_NOT_FOUND');
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    } else {
      const targetPath = path.join(this.localDir, storageKey.replace('documents/', ''));
      if (!fs.existsSync(targetPath)) {
        throw new AppError('Document file not found on disk storage.', 404, 'FILE_NOT_FOUND');
      }
      return fs.readFileSync(targetPath);
    }
  }
}

export const storageService = new StorageService();

