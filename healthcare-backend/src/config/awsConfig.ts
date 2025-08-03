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
