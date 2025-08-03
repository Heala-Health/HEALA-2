import { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';

export function fileErrorHandler(
  err: Error | multer.MulterError,
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
