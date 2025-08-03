import type { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { validatePaymentData } from '../utils/validation.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const paymentService = new PaymentService();

export class PaymentController {
  async initializePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount, paymentType = 'wallet_funding', metadata } = req.body;

      const validation = validatePaymentData({ amount, paymentType });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: { code: 'VALIDATION_ERROR', details: validation.errors }
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { profile: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      let result;

      if (paymentType === 'wallet_funding') {
        result = await paymentService.fundWallet({
          userId: user.id,
          amount: amount * 100, // Convert to kobo
          email: user.email,
          metadata
        });
      } else {
        result = await paymentService.initializePayment({
          email: user.email,
          amount: amount * 100,
          metadata: {
            userId: user.id,
            paymentType,
            ...metadata
          }
        });
      }

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: result
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Payment initialization failed'
      });
    }
  }

  async verifyPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { reference } = req.query;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required'
        });
      }

      const paymentData = await paymentService.verifyPayment(reference as string);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: paymentData
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Payment verification failed'
      });
    }
  }

  async getWallet(req: AuthenticatedRequest, res: Response) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: req.user!.id }
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      res.json({
        success: true,
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          lastUpdated: wallet.updatedAt
        }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet information'
      });
    }
  }

  async getTransactionHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { page, limit, status, from, to } = req.query;

      const result = await paymentService.getTransactionHistory(req.user!.id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string | undefined, // Explicitly allow undefined
        from: from as string | undefined, // Explicitly allow undefined
        to: to as string | undefined // Explicitly allow undefined
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve transaction history'
      });
    }
  }

  async processConsultationPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId, amount } = req.body;

      if (!sessionId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and amount are required'
        });
      }

      // Get consultation session
      const session = await prisma.consultationSession.findUnique({
        where: { id: sessionId },
        include: { appointment: true }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Consultation session not found'
        });
      }

      // Verify user is the patient
      if (session.patientId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const success = await paymentService.processConsultationPayment({
        sessionId,
        patientId: session.patientId,
        physicianId: session.physicianId,
        amount: amount * 100 // Convert to kobo
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: { paymentProcessed: success }
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Payment processing failed'
      });
    }
  }

  async webhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing signature'
        });
      }

      await paymentService.processWebhook(req.body, signature);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }

  async getBanks(req: Request, res: Response) {
    try {
      const banks = await paymentService.getBanks();

      res.json({
        success: true,
        data: { banks }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch banks'
      });
    }
  }

  async validateAccount(req: Request, res: Response) {
    try {
      const { accountNumber, bankCode } = req.body;

      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          success: false,
          message: 'Account number and bank code are required'
        });
      }

      const accountData = await paymentService.validateAccountNumber(accountNumber, bankCode);

      res.json({
        success: true,
        data: accountData
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Account validation failed'
      });
    }
  }

  async requestRefund(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionReference, reason, amount } = req.body;

      if (!transactionReference || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Transaction reference and reason are required'
        });
      }

      // Create refund request in database
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          actionType: 'REFUND_REQUEST',
          actionCategory: 'payment',
          newValues: {
            transactionReference,
            reason,
            amount,
            requestedAt: new Date().toISOString()
          },
          impactLevel: 'medium'
        }
      });

      // In production, this would trigger the refund process
      console.log(`Refund requested by ${req.user!.id} for transaction ${transactionReference}`);

      res.json({
        success: true,
        message: 'Refund request submitted successfully'
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit refund request'
      });
    }
  }

  async getPaymentStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: req.user!.id }
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Get transaction statistics
      const [totalCredits, totalDebits, transactionCount] = await Promise.all([
        prisma.walletTransaction.aggregate({
          where: {
            walletId: wallet.id,
            transactionType: 'credit'
          },
          _sum: { amount: true }
        }),
        prisma.walletTransaction.aggregate({
          where: {
            walletId: wallet.id,
            transactionType: 'debit'
          },
          _sum: { amount: true }
        }),
        prisma.walletTransaction.count({
          where: { walletId: wallet.id }
        })
      ]);

      res.json({
        success: true,
        data: {
          currentBalance: wallet.balance,
          totalCredits: totalCredits._sum.amount || 0,
          totalDebits: totalDebits._sum.amount || 0,
          totalTransactions: transactionCount,
          currency: wallet.currency
        }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment statistics'
      });
    }
  }
}
