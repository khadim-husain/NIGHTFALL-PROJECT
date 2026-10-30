import { prisma } from '../../config/prisma.js';
import { storageService, UploadedFileResult } from './storage.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole } from '@prisma/client';

export class DocumentsService {
  /**
   * Fast, reliable PDF page-count parser from raw binary buffer
   */
  public extractPdfPageCount(buffer: Buffer): number {
    try {
      const content = buffer.toString('binary');
      // Look for root /Type /Pages /Count N
      const countMatches = [...content.matchAll(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/g)];
      if (countMatches.length > 0) {
        const counts = countMatches.map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n) && n > 0);
        if (counts.length > 0) {
          return Math.max(...counts);
        }
      }

      // Fallback: Count /Type /Page declarations
      const pageMatches = [...content.matchAll(/\/Type\s*\/Page\b(?!\s*s)/g)];
      if (pageMatches.length > 0) {
        return pageMatches.length;
      }
    } catch {
      // Fallback
    }
    return 1;
  }

  public async uploadDocument(
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    pageCount = 1
  ) {
    let finalPageCount = pageCount > 0 ? pageCount : 1;
    if (
      mimeType === 'application/pdf' ||
      originalFilename.toLowerCase().endsWith('.pdf')
    ) {
      const parsedPages = this.extractPdfPageCount(fileBuffer);
      if (parsedPages > 1) {
        finalPageCount = parsedPages;
      }
    }

    const saved = await storageService.saveFile(fileBuffer, originalFilename, mimeType);

    const doc = await prisma.document.create({
      data: {
        ownerId: userId,
        storageKey: saved.storageKey,
        originalFilename: saved.originalFilename,
        verifiedMimeType: saved.verifiedMimeType,
        fileSize: saved.fileSize,
        pageCount: Math.max(1, finalPageCount),
        status: 'READY',
      },
    });

    return {
      ...doc,
      formattedSize: `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`,
    };
  }

  public async getDocumentById(docId: string, requestingUser: { id: string; role: UserRole }) {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { owner: { select: { id: true, email: true, displayName: true } } },
    });

    if (!doc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Role check: Customers can only access their own documents!
    if (requestingUser.role === UserRole.CUSTOMER && doc.ownerId !== requestingUser.id) {
      throw new AppError('Forbidden: You do not own this document.', 403, 'ACCESS_DENIED');
    }

    const downloadUrl = storageService.getSignedDownloadUrl(doc.storageKey);

    return {
      ...doc,
      formattedSize: `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`,
      downloadUrl,
    };
  }

  public async getUserDocuments(userId: string) {
    return prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const documentsService = new DocumentsService();

