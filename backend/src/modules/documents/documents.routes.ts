import { Router } from 'express';
import multer from 'multer';
import { documentsController } from './documents.controller.js';
import { authenticate } from '../../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.post('/upload', authenticate, upload.single('file'), (req, res, next) =>
  documentsController.upload(req, res, next)
);

router.get('/download', (req, res, next) => documentsController.download(req, res, next));

router.get('/:id', authenticate, (req, res, next) => documentsController.getById(req, res, next));

export default router;

