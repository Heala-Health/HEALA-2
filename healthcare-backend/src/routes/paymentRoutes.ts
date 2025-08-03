import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { rateLimitPayments } from '../middleware/rateLimitMiddleware.js';

const router = Router();
const paymentController = new PaymentController();

// Public routes
router.post('/webhook', paymentController.webhook);
router.get('/banks', paymentController.getBanks);
router.post('/validate-account', paymentController.validateAccount);

// Protected routes
router.use(authenticate);

// Payment operations
router.post('/initialize', rateLimitPayments, paymentController.initializePayment);
router.get('/verify', paymentController.verifyPayment);

// Wallet operations
router.get('/wallet', paymentController.getWallet);
router.get('/transactions', paymentController.getTransactionHistory);
router.get('/statistics', paymentController.getPaymentStatistics);

// Consultation payments
router.post('/consultation', paymentController.processConsultationPayment);

// Refund operations
router.post('/refund', paymentController.requestRefund);

export default router;
