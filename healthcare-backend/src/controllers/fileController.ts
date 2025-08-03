import { type Request, type Response } from 'express';
import { FileService } from '../services/fileService.js';
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { validateFileUpload } from '../utils/validation.js';
import multer, { type FileFilterCallback } from 'multer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const fileService = new FileService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 5 // Maximum 5 files at once
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Basic file type validation
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export class FileController {
  // Middleware for handling file uploads
  uploadMiddleware = upload.array('files', 5);

  async uploadFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const { fileType = 'document', folder, generateThumbnail } = req.body;

      // Validate request
      const validation = validateFileUpload({
        fileType,
        folder,
        fileCount: files.length
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            details: validation.errors
          }
        });
      }

      // Upload files
      const uploadPromises = files.map(file => 
        fileService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          {
            userId: req.user!.id,
            fileType: fileType as 'document' | 'image' | 'prescription' | 'report',
            folder: folder as string,
            generateThumbnail: generateThumbnail === 'true',
            metadata: {
              uploadedAt: new Date().toISOString(),
              userRole: req.user!.role
            }
          }
        )
      );

      const results = await Promise.all(uploadPromises);

      // Log file upload activity
      await this.logFileActivity(req.user!.id, 'UPLOAD', {
        fileCount: files.length,
        fileType,
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
      });

      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          files: results
        }
      });

    } catch (error: unknown) {
      console.error('File upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload files';
      res.status(500).json({
        success: false,
        message
      });
    }
  }

  async getFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required'
        });
      }

      const fileData = await fileService.getFile(fileId, req.user!.id);

      res.json({
        success: true,
        data: fileData
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'File not found';
      res.status(404).json({
        success: false,
        message
      });
    }
  }

  async downloadFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required'
        });
      }

      const fileData = await fileService.getFile(fileId, req.user!.id);

      // Log download activity
      await this.logFileActivity(req.user!.id, 'DOWNLOAD', {
        fileId,
        fileName: fileData.fileName
      });

      // Redirect to signed URL
      res.redirect(fileData.url);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'File not found';
      res.status(404).json({
        success: false,
        message
      });
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required'
        });
      }

      await fileService.deleteFile(fileId, req.user!.id);

      // Log deletion activity
      await this.logFileActivity(req.user!.id, 'DELETE', { fileId });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'File not found';
      res.status(404).json({
        success: false,
        message
      });
    }
  }

  async getPresignedUploadUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileName, fileType, documentType = 'document', folder } = req.body;

      if (!fileName || !fileType) {
        return res.status(400).json({
          success: false,
          message: 'File name and type are required'
        });
      }

      const result = await fileService.generatePresignedUploadUrl(
        fileName as string,
        fileType as string,
        req.user!.id,
        {
          fileType: documentType as 'document' | 'image' | 'prescription' | 'report',
          folder: folder as string,
          metadata: {
            userRole: req.user!.role
          }
        }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate upload URL';
      res.status(500).json({
        success: false,
        message
      });
    }
  }

  async getUserFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        documentType, 
        search,
        sortBy = 'uploadDate',
        sortOrder = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: PrismaClient['document']['findMany']['arguments']['where'] = {
        userId: req.user!.id
      };

      if (typeof documentType === 'string') {
        where.documentType = documentType;
      }

      if (typeof search === 'string') {
        where.documentName = {
          contains: search,
          mode: 'insensitive'
        };
      }

      const [files, total] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: {
            [sortBy as string]: sortOrder
          }
        }),
        prisma.document.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve files';
      res.status(500).json({
        success: false,
        message
      });
    }
  }

  async verifyDocument(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admin/hospital admin can verify documents
      if (!req.user || !['ADMIN', 'HOSPITAL_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const { documentId } = req.params;
      const { status, notes } = req.body;

      const document = await prisma.document.update({
        where: { id: documentId },
        data: {
          verificationStatus: status as string,
          verifiedBy: req.user!.id,
          verifiedAt: new Date()
        }
      });

      // Log verification activity
      await this.logFileActivity(req.user!.id, 'VERIFY', {
        documentId,
        status,
        notes
      });

      res.json({
        success: true,
        message: 'Document verification updated',
        data: document
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify document';
      res.status(500).json({
        success: false,
        message
      });
    }
  }

  private async logFileActivity(userId: string, activityType: string, details: Record<string, unknown>) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          actionType: activityType,
          actionCategory: 'file_management',
          newValues: details,
          impactLevel: 'low'
        }
      });
    } catch (error) {
      console.error('Error logging file activity:', error);
    }
  }
}
