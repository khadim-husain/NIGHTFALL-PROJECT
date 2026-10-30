import { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service.js';
import { storageService } from './storage.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export class DocumentsController {
  public async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No file provided for upload. Please attach a file under key "file".', 400, 'FILE_MISSING');
      }

      if (!req.user) {
        throw new AppError('Authentication required to upload documents.', 401, 'UNAUTHORIZED');
      }

      const rawPages = req.body.pageCount ? parseInt(req.body.pageCount, 10) : 1;
      const doc = await documentsService.uploadDocument(
        req.user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        isNaN(rawPages) ? 1 : rawPages
      );

      res.status(201).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const docId = String(req.params.id);
      const doc = await documentsService.getDocumentById(docId, req.user);
      res.json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  public async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storageKey = req.query.key as string;
      const expires = parseInt(req.query.expires as string, 10);
      const signature = req.query.sig as string;

      if (!storageKey || isNaN(expires) || !signature) {
        throw new AppError('Invalid download parameters or signature missing.', 403, 'INVALID_SIGNATURE');
      }

      const isValid = storageService.verifyDownloadSignature(storageKey, expires, signature);
      if (!isValid) {
        throw new AppError('Document download signature is invalid or has expired.', 403, 'DOWNLOAD_EXPIRED');
      }

      const buffer = await storageService.getFileBuffer(storageKey);
      const filename = storageKey.split('-').slice(2).join('-') || 'document.pdf';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
