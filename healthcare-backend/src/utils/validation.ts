import Joi, { type ValidationErrorItem } from 'joi';
import { PAYSTACK_CONFIG } from '../config/paystackConfig.js';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('PATIENT', 'PHYSICIAN', 'AGENT', 'HOSPITAL_ADMIN').required(),
  specialization: Joi.string().when('role', {
    is: 'PHYSICIAN',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  licenseNumber: Joi.string().when('role', {
    is: 'PHYSICIAN',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  hospitalId: Joi.string().when('role', {
    is: Joi.valid('PHYSICIAN', 'HOSPITAL_ADMIN'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const fileUploadSchema = Joi.object({
  fileType: Joi.string().valid('document', 'image', 'prescription', 'report').required(),
  folder: Joi.string().optional(),
  fileCount: Joi.number().min(1).max(5).required()
});

const paymentSchema = Joi.object({
  amount: Joi.number()
    .min(PAYSTACK_CONFIG.limits.minimum / 100)
    .max(PAYSTACK_CONFIG.limits.maximum / 100)
    .required(),
  paymentType: Joi.string()
    .valid('wallet_funding', 'consultation', 'appointment')
    .required(),
  metadata: Joi.object().optional()
});

export function validateRegisterInput(data: Record<string, unknown>) {
  const { error } = registerSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}

export function validateLoginInput(data: Record<string, unknown>) {
  const { error } = loginSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}

export function validateFileUpload(data: Record<string, unknown>) {
  const { error } = fileUploadSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}

export function validatePaymentData(data: Record<string, unknown>) {
  const { error } = paymentSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map((detail: ValidationErrorItem) => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}

// Export other utility functions from fileValidation.ts if needed later
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
