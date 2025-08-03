import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { rateLimitAuth } from '../middleware/rateLimitMiddleware.js';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/register', rateLimitAuth, authController.register);
router.post('/login', rateLimitAuth, authController.login);
router.post('/refresh', rateLimitAuth, authController.refreshToken);
router.post('/forgot-password', rateLimitAuth, authController.forgotPassword);
router.post('/reset-password', rateLimitAuth, authController.resetPassword);
router.get('/verify-email', authController.verifyEmail);

// Protected routes
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
