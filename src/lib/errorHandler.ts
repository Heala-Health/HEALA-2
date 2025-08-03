
import { useToast } from '@/hooks/use-toast';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMessages = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  AUTHORIZATION_ERROR: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PAYMENT_ERROR: 'Payment processing failed. Please try again or contact support.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  CONSULTATION_ERROR: 'Unable to start consultation. Please try again.',
  EMERGENCY_ERROR: 'Emergency request failed. Please try again or call emergency services.',
  WALLET_ERROR: 'Wallet operation failed. Please try again.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
};

export const handleError = (error: any, toast: ReturnType<typeof useToast>['toast']) => {
  console.error('Application error:', error);
  
  let title = 'Error';
  let description = errorMessages.SERVER_ERROR;
  
  if (error instanceof AppError) {
    title = error.name;
    description = error.message;
  } else if (error?.message) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      description = errorMessages.NETWORK_ERROR;
    } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      description = errorMessages.AUTHENTICATION_ERROR;
    } else if (error.message.includes('validation')) {
      description = errorMessages.VALIDATION_ERROR;
    } else if (error.message.includes('payment')) {
      description = errorMessages.PAYMENT_ERROR;
    } else {
      description = error.message;
    }
  }
  
  toast({
    title,
    description,
    variant: 'destructive',
    duration: 5000,
  });
};

export const showSuccess = (message: string, toast: ReturnType<typeof useToast>['toast']) => {
  toast({
    title: 'Success',
    description: message,
    variant: 'default',
    duration: 3000,
  });
};

export const showInfo = (message: string, toast: ReturnType<typeof useToast>['toast']) => {
  toast({
    title: 'Info',
    description: message,
    variant: 'default',
    duration: 4000,
  });
};
