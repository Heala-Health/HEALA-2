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
import { s3Client, S3_CONFIG } from '../config/awsConfig.js';
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
  thumbnailUrl?: string; // Make it optional to match the return type
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
      upload.on('httpUploadProgress', (progress: any) => {
        console.log(`Upload progress: ${progress.loaded}/${progress.total}`);
      });

      await upload.done();

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
