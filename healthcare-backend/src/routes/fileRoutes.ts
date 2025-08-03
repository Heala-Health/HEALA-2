import { Router } from 'express';
import { FileController } from '../controllers/fileController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { rateLimitFiles } from '../middleware/rateLimitMiddleware.js';

const router = Router();
const fileController = new FileController();

// All routes require authentication
router.use(authenticate);

// File upload routes
router.post('/upload', 
  rateLimitFiles,
  fileController.uploadMiddleware,
  fileController.uploadFiles
);

router.post('/presigned-url', 
  rateLimitFiles,
  fileController.getPresignedUploadUrl
);

// File management routes
router.get('/my-files', fileController.getUserFiles);
router.get('/:fileId', fileController.getFile);
router.get('/:fileId/download', fileController.downloadFile);
router.delete('/:fileId', fileController.deleteFile);

// Admin routes
router.put('/:documentId/verify',
  authorize('ADMIN', 'HOSPITAL_ADMIN'),
  fileController.verifyDocument
);

export default router;
