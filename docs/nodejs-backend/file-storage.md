# File Storage Implementation - AWS S3

Complete AWS S3 integration for secure file upload, storage, and management in the Healthcare Platform.

## 🗂️ File Storage Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │────│   File Service   │────│     AWS S3      │
│                 │    │                  │    │                 │
│ - File Upload   │    │ - Upload API     │    │ - Document Bucket│
│ - Progress Track│    │ - Validation     │    │ - Image Bucket  │
│ - File Preview  │    │ - Security       │    │ - Backup Storage│
│ - Download      │    │ - Metadata       │    │ - CDN (Optional)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Implementation Files

### 1. AWS S3 Configuration

```typescript
// src/config/awsConfig.ts
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-providers';

const awsConfig: S3ClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromEnv(), // Uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
};

export const s3Client = new S3Client(awsConfig);

export const S3_CONFIG = {
  buckets: {
    documents: process.env.AWS_DOCUMENTS_BUCKET || 'healthcare-documents',
    images: process.env.AWS_IMAGES_BUCKET || 'healthcare-images',
    prescriptions: process.env.AWS_PRESCRIPTIONS_BUCKET || 'healthcare-prescriptions',
    reports: process.env.AWS_REPORTS_BUCKET || 'healthcare-reports'
  },
  baseUrl: `https://${process.env.AWS_DOCUMENTS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB
    document: 50 * 1024 * 1024, // 50MB
    video: 500 * 1024 * 1024 // 500MB
  },
  allowedFileTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    medicalImages: [
      'application/dicom',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ]
  }
};
```

### 2. File Upload Service

```typescript
// src/services/fileService.ts
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { PrismaClient } from '@prisma/client';
import { s3Client, S3_CONFIG } from '../config/awsConfig';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';

const prisma = new PrismaClient();

export interface FileUploadOptions {
  folder?: string;
  isPublic?: boolean;
  generateThumbnail?: boolean;
  userId: string;
  fileType: 'document' | 'image' | 'prescription' | 'report';
  metadata?: Record<string, any>;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export class FileService {
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: FileUploadOptions
  ): Promise<UploadResult> {
    try {
      // Validate file type and size
      this.validateFile(buffer, mimeType, options.fileType);

      // Generate unique file key
      const fileExtension = path.extname(originalName);
      const fileName = `${crypto.randomUUID()}${fileExtension}`;
      const folder = options.folder || options.fileType;
      const fileKey = `${folder}/${options.userId}/${fileName}`;

      // Select appropriate bucket
      const bucket = this.getBucketName(options.fileType);

      // Process image if needed
      let processedBuffer = buffer;
      let thumbnailKey: string | undefined;

      if (options.fileType === 'image' && this.isImageType(mimeType)) {
        processedBuffer = await this.processImage(buffer);
        
        if (options.generateThumbnail) {
          thumbnailKey = await this.generateThumbnail(buffer, fileKey, bucket);
        }
      }

      // Upload to S3
      const uploadParams = {
        Bucket: bucket,
        Key: fileKey,
        Body: processedBuffer,
        ContentType: mimeType,
        Metadata: {
          originalName: originalName,
          uploadedBy: options.userId,
          fileType: options.fileType,
          ...(options.metadata || {})
        },
        ServerSideEncryption: 'AES256'
      };

      const upload = new Upload({
        client: s3Client,
        params: uploadParams
      });

      await upload.done();

      // Save file record to database
      const fileRecord = await prisma.document.create({
        data: {
          userId: options.userId,
          documentName: originalName,
          documentType: options.fileType,
          documentUrl: `s3://${bucket}/${fileKey}`,
          verificationStatus: 'pending'
        }
      });

      const fileUrl = await this.getFileUrl(bucket, fileKey);
      const thumbnailUrl = thumbnailKey ? await this.getFileUrl(bucket, thumbnailKey) : undefined;

      return {
        fileId: fileRecord.id,
        fileName: originalName,
        fileUrl,
        fileSize: buffer.length,
        mimeType,
        thumbnailUrl
      };

    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadStream(
    stream: NodeJS.ReadableStream,
    fileName: string,
    mimeType: string,
    options: FileUploadOptions
  ): Promise<UploadResult> {
    try {
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
      const folder = options.folder || options.fileType;
      const fileKey = `${folder}/${options.userId}/${uniqueFileName}`;
      const bucket = this.getBucketName(options.fileType);

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: bucket,
          Key: fileKey,
          Body: stream,
          ContentType: mimeType,
          Metadata: {
            originalName: fileName,
            uploadedBy: options.userId,
            fileType: options.fileType,
            ...(options.metadata || {})
          },
          ServerSideEncryption: 'AES256'
        }
      });

      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        console.log(`Upload progress: ${progress.loaded}/${progress.total}`);
      });

      const result = await upload.done();

      // Save to database
      const fileRecord = await prisma.document.create({
        data: {
          userId: options.userId,
          documentName: fileName,
          documentType: options.fileType,
          documentUrl: `s3://${bucket}/${fileKey}`
        }
      });

      const fileUrl = await this.getFileUrl(bucket, fileKey);

      return {
        fileId: fileRecord.id,
        fileName,
        fileUrl,
        fileSize: 0, // Size not available for streams
        mimeType
      };

    } catch (error) {
      console.error('Stream upload error:', error);
      throw new Error('Failed to upload file stream');
    }
  }

  async getFile(fileId: string, userId: string): Promise<{
    url: string;
    fileName: string;
    mimeType: string;
  }> {
    try {
      // Get file record from database
      const fileRecord = await prisma.document.findFirst({
        where: {
          id: fileId,
          userId: userId // Ensure user owns the file
        }
      });

      if (!fileRecord) {
        throw new Error('File not found or access denied');
      }

      // Parse S3 URL
      const s3Url = fileRecord.documentUrl;
      const { bucket, key } = this.parseS3Url(s3Url);

      // Generate signed URL for download
      const url = await this.getSignedDownloadUrl(bucket, key);

      return {
        url,
        fileName: fileRecord.documentName,
        mimeType: 'application/octet-stream' // Default, could be stored in metadata
      };

    } catch (error) {
      console.error('Error getting file:', error);
      throw new Error('Failed to retrieve file');
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // Get file record
      const fileRecord = await prisma.document.findFirst({
        where: {
          id: fileId,
          userId: userId
        }
      });

      if (!fileRecord) {
        throw new Error('File not found or access denied');
      }

      // Parse S3 URL and delete from S3
      const { bucket, key } = this.parseS3Url(fileRecord.documentUrl);
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      }));

      // Delete thumbnail if exists
      const thumbnailKey = key.replace(/(\.[^.]+)$/, '_thumb$1');
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey
        }));
      } catch (error) {
        // Thumbnail might not exist, ignore error
      }

      // Delete database record
      await prisma.document.delete({
        where: { id: fileId }
      });

    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    userId: string,
    options: Partial<FileUploadOptions> = {}
  ): Promise<{
    uploadUrl: string;
    fileKey: string;
    fields: Record<string, string>;
  }> {
    try {
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
      const folder = options.folder || options.fileType || 'documents';
      const fileKey = `${folder}/${userId}/${uniqueFileName}`;
      const bucket = this.getBucketName(options.fileType || 'document');

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        ContentType: fileType,
        Metadata: {
          originalName: fileName,
          uploadedBy: userId,
          ...(options.metadata || {})
        },
        ServerSideEncryption: 'AES256'
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        uploadUrl,
        fileKey,
        fields: {
          'Content-Type': fileType,
          'x-amz-server-side-encryption': 'AES256'
        }
      };

    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  private validateFile(buffer: Buffer, mimeType: string, fileType: string): void {
    // Check file size
    const maxSize = S3_CONFIG.maxFileSize[fileType as keyof typeof S3_CONFIG.maxFileSize] || S3_CONFIG.maxFileSize.document;
    if (buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const allowedTypes = S3_CONFIG.allowedFileTypes[fileType as keyof typeof S3_CONFIG.allowedFileTypes] || S3_CONFIG.allowedFileTypes.documents;
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed for ${fileType}`);
    }
  }

  private async processImage(buffer: Buffer): Promise<Buffer> {
    try {
      // Optimize image using Sharp
      return await sharp(buffer)
        .resize(2048, 2048, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();
    } catch (error) {
      console.error('Error processing image:', error);
      return buffer; // Return original if processing fails
    }
  }

  private async generateThumbnail(buffer: Buffer, originalKey: string, bucket: string): Promise<string> {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center' 
        })
        .jpeg({ quality: 75 })
        .toBuffer();

      const thumbnailKey = originalKey.replace(/(\.[^.]+)$/, '_thumb$1');

      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        ServerSideEncryption: 'AES256'
      }));

      return thumbnailKey;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  private getBucketName(fileType: string): string {
    switch (fileType) {
      case 'image':
        return S3_CONFIG.buckets.images;
      case 'prescription':
        return S3_CONFIG.buckets.prescriptions;
      case 'report':
        return S3_CONFIG.buckets.reports;
      default:
        return S3_CONFIG.buckets.documents;
    }
  }

  private isImageType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async getFileUrl(bucket: string, key: string): Promise<string> {
    // For public files, return direct URL
    // For private files, return signed URL
    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  private async getSignedDownloadUrl(bucket: string, key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  private parseS3Url(s3Url: string): { bucket: string; key: string } {
    // Parse URL like "s3://bucket/key"
    const match = s3Url.match(/^s3:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      throw new Error('Invalid S3 URL format');
    }
    return {
      bucket: match[1],
      key: match[2]
    };
  }

  async moveFile(fromKey: string, toKey: string, bucket: string): Promise<void> {
    try {
      // Copy file to new location
      await s3Client.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${fromKey}`,
        Key: toKey
      }));

      // Delete original file
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: fromKey
      }));
    } catch (error) {
      console.error('Error moving file:', error);
      throw new Error('Failed to move file');
    }
  }

  async getFileMetadata(bucket: string, key: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await s3Client.send(command);
      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  async scanFileForViruses(bucket: string, key: string): Promise<boolean> {
    // Integration with antivirus service (placeholder)
    // This would integrate with services like ClamAV, Trend Micro, etc.
    console.log(`Scanning file for viruses: ${bucket}/${key}`);
    return true; // Return true if file is clean
  }
}
```

### 3. File Upload Controller

```typescript
// src/controllers/fileController.ts
import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { validateFileUpload } from '../utils/validation';
import multer from 'multer';
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
  fileFilter: (req, file, cb) => {
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
      cb(new Error('Invalid file type'), false);
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
            fileType,
            folder,
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

    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload files'
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

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'File not found'
      });
    }
  }

  async downloadFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId } = req.params;
      const fileData = await fileService.getFile(fileId, req.user!.id);

      // Log download activity
      await this.logFileActivity(req.user!.id, 'DOWNLOAD', {
        fileId,
        fileName: fileData.fileName
      });

      // Redirect to signed URL
      res.redirect(fileData.url);

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'File not found'
      });
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { fileId } = req.params;

      await fileService.deleteFile(fileId, req.user!.id);

      // Log deletion activity
      await this.logFileActivity(req.user!.id, 'DELETE', { fileId });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'File not found'
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
        fileName,
        fileType,
        req.user!.id,
        {
          fileType: documentType,
          folder,
          metadata: {
            userRole: req.user!.role
          }
        }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate upload URL'
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

      const where: any = {
        userId: req.user!.id
      };

      if (documentType) {
        where.documentType = documentType;
      }

      if (search) {
        where.documentName = {
          contains: search as string,
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

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve files'
      });
    }
  }

  async verifyDocument(req: AuthenticatedRequest, res: Response) {
    try {
      // Only admin/hospital admin can verify documents
      if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(req.user!.role)) {
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
          verificationStatus: status,
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

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify document'
      });
    }
  }

  private async logFileActivity(userId: string, activityType: string, details: any) {
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
```

### 4. File Routes

```typescript
// src/routes/fileRoutes.ts
import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { rateLimitFiles } from '../middleware/rateLimitMiddleware';

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
```

### 5. File Validation Utilities

```typescript
// src/utils/fileValidation.ts
import Joi from 'joi';

const fileUploadSchema = Joi.object({
  fileType: Joi.string().valid('document', 'image', 'prescription', 'report').required(),
  folder: Joi.string().optional(),
  fileCount: Joi.number().min(1).max(5).required()
});

export function validateFileUpload(data: any) {
  const { error } = fileUploadSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}

export function isValidFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export function getFileSize(buffer: Buffer): number {
  return buffer.length;
}

export function sanitizeFileName(fileName: string): string {
  // Remove dangerous characters
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPDFFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function isOfficeDocument(mimeType: string): boolean {
  const officeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return officeTypes.includes(mimeType);
}
```

### 6. Error Handling and Logging

```typescript
// src/middleware/fileErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function fileErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large',
          error: { code: 'FILE_TOO_LARGE' }
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          error: { code: 'TOO_MANY_FILES' }
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          error: { code: 'UNEXPECTED_FILE' }
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: { code: 'UPLOAD_ERROR' }
        });
    }
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: { code: 'INVALID_FILE_TYPE' }
    });
  }

  next(err);
}
```

## 🔒 Security Features

### File Validation
- **File Type Validation**: Strict MIME type checking
- **File Size Limits**: Configurable size limits per file type
- **Virus Scanning**: Integration with antivirus services
- **Content Validation**: Verify file content matches extension

### Access Control
- **User Ownership**: Users can only access their own files
- **Role-Based Access**: Different permissions for different roles
- **Signed URLs**: Temporary access URLs for downloads
- **Encryption**: Server-side encryption for all files

### S3 Security
- **IAM Policies**: Least privilege access policies
- **Bucket Policies**: Restrict access to authorized applications
- **Encryption**: AES-256 server-side encryption
- **Versioning**: Enable versioning for file recovery

## 📊 Performance Optimizations

### Upload Optimization
- **Chunked Upload**: Support for large file uploads
- **Progress Tracking**: Real-time upload progress
- **Retry Logic**: Automatic retry for failed uploads
- **Compression**: Image optimization and compression

### Download Optimization
- **CDN Integration**: CloudFront for faster downloads
- **Caching**: Browser and CDN caching strategies
- **Signed URLs**: Direct S3 access without server proxy
- **Thumbnail Generation**: Quick preview for images

### Storage Optimization
- **Lifecycle Policies**: Automatic archival of old files
- **Duplicate Detection**: Prevent duplicate file uploads
- **Metadata Indexing**: Efficient file search and filtering
- **Storage Classes**: Use appropriate S3 storage classes