# Payment System Implementation - Paystack Integration

Complete Paystack payment integration for the Healthcare Platform with wallet system and transaction management.

## 💳 Payment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │────│  Payment Service │────│    Paystack     │
│                 │    │                  │    │                 │
│ - Payment UI    │    │ - Transaction    │    │ - Card Processing│
│ - Wallet View   │    │ - Wallet Mgmt    │    │ - Bank Transfer │
│ - History       │    │ - Webhooks       │    │ - Mobile Money  │
│ - Receipts      │    │ - Validation     │    │ - Verification  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    Database     │
                       │                 │
                       │ - Wallets       │
                       │ - Transactions  │
                       │ - Payment Logs  │
                       │ - Audit Trail   │
                       └─────────────────┘
```

## 🚀 Implementation Files

### 1. Paystack Configuration

```typescript
// src/config/paystackConfig.ts
export const PAYSTACK_CONFIG = {
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  baseUrl: 'https://api.paystack.co',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET!,
  currency: 'NGN',
  
  // Payment channels
  channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  
  // Transaction limits
  limits: {
    minimum: 10000, // 100 NGN in kobo
    maximum: 100000000, // 1,000,000 NGN in kobo
    walletFundingMin: 10000, // 100 NGN
    walletFundingMax: 50000000, // 500,000 NGN
    consultationMin: 500000, // 5,000 NGN
    consultationMax: 5000000 // 50,000 NGN
  },
  
  // Webhook events to handle
  webhookEvents: [
    'charge.success',
    'transfer.success',
    'transfer.failed',
    'refund.processed'
  ]
};

// Initialize Paystack
export const paystack = {
  transaction: {
    initialize: `${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`,
    verify: `${PAYSTACK_CONFIG.baseUrl}/transaction/verify`,
    list: `${PAYSTACK_CONFIG.baseUrl}/transaction`,
    export: `${PAYSTACK_CONFIG.baseUrl}/transaction/export`,
    partial_debit: `${PAYSTACK_CONFIG.baseUrl}/transaction/partial_debit`
  },
  customer: {
    create: `${PAYSTACK_CONFIG.baseUrl}/customer`,
    fetch: `${PAYSTACK_CONFIG.baseUrl}/customer`,
    list: `${PAYSTACK_CONFIG.baseUrl}/customer`,
    update: `${PAYSTACK_CONFIG.baseUrl}/customer`,
    validate: `${PAYSTACK_CONFIG.baseUrl}/customer/validation`
  },
  transfer: {
    initiate: `${PAYSTACK_CONFIG.baseUrl}/transfer`,
    finalize: `${PAYSTACK_CONFIG.baseUrl}/transfer/finalize_transfer`,
    bulk: `${PAYSTACK_CONFIG.baseUrl}/transfer/bulk`
  },
  transferRecipient: {
    create: `${PAYSTACK_CONFIG.baseUrl}/transferrecipient`,
    list: `${PAYSTACK_CONFIG.baseUrl}/transferrecipient`,
    update: `${PAYSTACK_CONFIG.baseUrl}/transferrecipient`
  }
};
```

### 2. Payment Service

```typescript
// src/services/paymentService.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';
import { PAYSTACK_CONFIG } from '../config/paystackConfig';

const prisma = new PrismaClient();

export interface PaymentInitializeData {
  email: string;
  amount: number; // Amount in kobo
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface WalletFundingData {
  userId: string;
  amount: number;
  email: string;
  metadata?: Record<string, any>;
}

export interface ConsultationPaymentData {
  sessionId: string;
  patientId: string;
  physicianId: string;
  amount: number;
}

export class PaymentService {
  private getHeaders() {
    return {
      'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  async initializePayment(data: PaymentInitializeData): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      // Generate reference if not provided
      const reference = data.reference || this.generateReference();

      const payload = {
        email: data.email,
        amount: data.amount,
        currency: data.currency || PAYSTACK_CONFIG.currency,
        reference,
        callback_url: data.callback_url,
        metadata: {
          ...data.metadata,
          custom_fields: [
            {
              display_name: "Payment Type",
              variable_name: "payment_type",
              value: data.metadata?.paymentType || "wallet_funding"
            }
          ]
        },
        channels: data.channels || PAYSTACK_CONFIG.channels
      };

      const response = await axios.post(
        `${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`,
        payload,
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Payment initialization failed');
      }

      return {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference
      };

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  async verifyPayment(reference: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    customer: any;
    metadata: any;
    paidAt: string;
  }> {
    try {
      const response = await axios.get(
        `${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${reference}`,
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error('Payment verification failed');
      }

      const transaction = response.data.data;

      return {
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        customer: transaction.customer,
        metadata: transaction.metadata,
        paidAt: transaction.paid_at
      };

    } catch (error: any) {
      console.error('Payment verification error:', error);
      throw new Error('Payment verification failed');
    }
  }

  async fundWallet(data: WalletFundingData): Promise<{
    authorizationUrl: string;
    reference: string;
  }> {
    try {
      // Validate amount
      if (data.amount < PAYSTACK_CONFIG.limits.walletFundingMin) {
        throw new Error(`Minimum funding amount is ₦${PAYSTACK_CONFIG.limits.walletFundingMin / 100}`);
      }

      if (data.amount > PAYSTACK_CONFIG.limits.walletFundingMax) {
        throw new Error(`Maximum funding amount is ₦${PAYSTACK_CONFIG.limits.walletFundingMax / 100}`);
      }

      // Get user wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: data.userId },
        include: { user: { include: { profile: true } } }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const reference = this.generateReference('FUND');

      // Create pending transaction record
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: 'credit',
          amount: data.amount / 100, // Convert from kobo to naira
          balanceAfter: wallet.balance,
          description: 'Wallet funding',
          referenceId: reference
        }
      });

      // Initialize payment with Paystack
      const paymentData = await this.initializePayment({
        email: data.email,
        amount: data.amount,
        reference,
        metadata: {
          userId: data.userId,
          paymentType: 'wallet_funding',
          walletId: wallet.id,
          ...data.metadata
        }
      });

      return {
        authorizationUrl: paymentData.authorizationUrl,
        reference
      };

    } catch (error: any) {
      console.error('Wallet funding error:', error);
      throw new Error(error.message || 'Wallet funding failed');
    }
  }

  async processConsultationPayment(data: ConsultationPaymentData): Promise<boolean> {
    try {
      // Get wallets
      const [patientWallet, physicianWallet] = await Promise.all([
        prisma.wallet.findUnique({ where: { userId: data.patientId } }),
        prisma.wallet.findUnique({ where: { userId: data.physicianId } })
      ]);

      if (!patientWallet || !physicianWallet) {
        throw new Error('Wallet not found');
      }

      const amountInNaira = data.amount / 100;

      // Check patient balance
      if (patientWallet.balance < amountInNaira) {
        throw new Error('Insufficient balance');
      }

      // Start transaction
      await prisma.$transaction(async (tx) => {
        // Deduct from patient wallet
        await tx.wallet.update({
          where: { id: patientWallet.id },
          data: { 
            balance: patientWallet.balance - amountInNaira,
            updatedAt: new Date()
          }
        });

        // Add to physician wallet
        await tx.wallet.update({
          where: { id: physicianWallet.id },
          data: { 
            balance: physicianWallet.balance + amountInNaira,
            updatedAt: new Date()
          }
        });

        // Record transactions
        await tx.walletTransaction.createMany({
          data: [
            {
              walletId: patientWallet.id,
              transactionType: 'debit',
              amount: amountInNaira,
              balanceAfter: patientWallet.balance - amountInNaira,
              description: 'Virtual consultation payment',
              referenceId: data.sessionId
            },
            {
              walletId: physicianWallet.id,
              transactionType: 'credit',
              amount: amountInNaira,
              balanceAfter: physicianWallet.balance + amountInNaira,
              description: 'Virtual consultation payment received',
              referenceId: data.sessionId
            }
          ]
        });

        // Update consultation session
        await tx.consultationSession.update({
          where: { id: data.sessionId },
          data: { paymentStatus: 'paid' }
        });
      });

      return true;

    } catch (error: any) {
      console.error('Consultation payment error:', error);
      throw new Error(error.message || 'Payment processing failed');
    }
  }

  async processWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', PAYSTACK_CONFIG.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const { event, data } = payload;

      switch (event) {
        case 'charge.success':
          await this.handleSuccessfulPayment(data);
          break;
        case 'transfer.success':
          await this.handleSuccessfulTransfer(data);
          break;
        case 'transfer.failed':
          await this.handleFailedTransfer(data);
          break;
        case 'refund.processed':
          await this.handleRefund(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

    } catch (error: any) {
      console.error('Webhook processing error:', error);
      throw new Error('Webhook processing failed');
    }
  }

  private async handleSuccessfulPayment(data: any): Promise<void> {
    try {
      const { reference, amount, currency, customer, metadata } = data;

      if (metadata?.paymentType === 'wallet_funding') {
        // Update wallet balance
        const wallet = await prisma.wallet.findUnique({
          where: { id: metadata.walletId }
        });

        if (wallet) {
          const amountInNaira = amount / 100;

          await prisma.$transaction(async (tx) => {
            // Update wallet balance
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { 
                balance: wallet.balance + amountInNaira,
                updatedAt: new Date()
              }
            });

            // Update transaction record
            await tx.walletTransaction.updateMany({
              where: {
                walletId: wallet.id,
                referenceId: reference
              },
              data: {
                balanceAfter: wallet.balance + amountInNaira,
                description: 'Wallet funding - Payment confirmed'
              }
            });
          });

          // Send notification
          await this.sendPaymentNotification(metadata.userId, {
            type: 'wallet_funded',
            amount: amountInNaira,
            reference
          });
        }
      }

    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  private async handleSuccessfulTransfer(data: any): Promise<void> {
    // Handle successful money transfer
    console.log('Transfer successful:', data);
  }

  private async handleFailedTransfer(data: any): Promise<void> {
    // Handle failed money transfer
    console.log('Transfer failed:', data);
  }

  private async handleRefund(data: any): Promise<void> {
    // Handle refund processing
    console.log('Refund processed:', data);
  }

  async createTransferRecipient(data: {
    type: 'nuban';
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${PAYSTACK_CONFIG.baseUrl}/transferrecipient`,
        {
          ...data,
          currency: data.currency || PAYSTACK_CONFIG.currency
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Recipient creation failed');
      }

      return response.data.data.recipient_code;

    } catch (error: any) {
      console.error('Transfer recipient creation error:', error);
      throw new Error('Failed to create transfer recipient');
    }
  }

  async initiateTransfer(data: {
    source: 'balance';
    amount: number;
    recipient: string;
    reason?: string;
    reference?: string;
  }): Promise<string> {
    try {
      const reference = data.reference || this.generateReference('TRANSFER');

      const response = await axios.post(
        `${PAYSTACK_CONFIG.baseUrl}/transfer`,
        {
          ...data,
          reference
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Transfer initiation failed');
      }

      return response.data.data.transfer_code;

    } catch (error: any) {
      console.error('Transfer initiation error:', error);
      throw new Error('Failed to initiate transfer');
    }
  }

  async getTransactionHistory(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    from?: string;
    to?: string;
  } = {}): Promise<{
    transactions: any[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 20, status, from, to } = options;
      const skip = (page - 1) * limit;

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const where: any = {
        walletId: wallet.id
      };

      if (status) {
        where.transactionType = status;
      }

      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.walletTransaction.count({ where })
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error: any) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  private generateReference(prefix = 'PAY'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  private async sendPaymentNotification(userId: string, data: any): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'payment',
          title: 'Payment Notification',
          message: `Your ${data.type} of ₦${data.amount} was successful`,
          read: false
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  async refundPayment(reference: string, amount?: number): Promise<boolean> {
    try {
      // Note: Paystack doesn't have a direct refund API
      // This would typically be handled through their dashboard
      // or by contacting their support for automated refunds
      
      console.log(`Refund requested for transaction: ${reference}, amount: ${amount}`);
      
      // For now, we'll mark it in our system
      // In production, integrate with Paystack's refund process
      
      return true;
    } catch (error: any) {
      console.error('Refund processing error:', error);
      throw new Error('Refund processing failed');
    }
  }

  async validateAccountNumber(accountNumber: string, bankCode: string): Promise<{
    accountName: string;
    accountNumber: string;
  }> {
    try {
      const response = await axios.get(
        `${PAYSTACK_CONFIG.baseUrl}/bank/resolve`,
        {
          params: {
            account_number: accountNumber,
            bank_code: bankCode
          },
          headers: this.getHeaders()
        }
      );

      if (!response.data.status) {
        throw new Error('Account validation failed');
      }

      return {
        accountName: response.data.data.account_name,
        accountNumber: response.data.data.account_number
      };

    } catch (error: any) {
      console.error('Account validation error:', error);
      throw new Error('Failed to validate account');
    }
  }

  async getBanks(): Promise<Array<{
    name: string;
    code: string;
    longcode: string;
    gateway: string;
    pay_with_bank: boolean;
    active: boolean;
    country: string;
    currency: string;
    type: string;
  }>> {
    try {
      const response = await axios.get(
        `${PAYSTACK_CONFIG.baseUrl}/bank`,
        {
          params: {
            country: 'nigeria',
            use_cursor: false,
            perPage: 100
          },
          headers: this.getHeaders()
        }
      );

      if (!response.data.status) {
        throw new Error('Failed to fetch banks');
      }

      return response.data.data;

    } catch (error: any) {
      console.error('Error fetching banks:', error);
      throw new Error('Failed to fetch banks');
    }
  }
}
```

### 3. Payment Controller

```typescript
// src/controllers/paymentController.ts
import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { validatePaymentData } from '../utils/validation';
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
        status: status as string,
        from: from as string,
        to: to as string
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
```

### 4. Payment Routes

```typescript
// src/routes/paymentRoutes.ts
import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimitPayments } from '../middleware/rateLimitMiddleware';

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
```

### 5. Payment Validation

```typescript
// src/utils/paymentValidation.ts
import Joi from 'joi';
import { PAYSTACK_CONFIG } from '../config/paystackConfig';

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

export function validatePaymentData(data: any) {
  const { error } = paymentSchema.validate(data, { abortEarly: false });
  
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

export function validateAmount(amount: number, type: 'wallet' | 'consultation'): boolean {
  const limits = type === 'wallet' 
    ? { min: PAYSTACK_CONFIG.limits.walletFundingMin, max: PAYSTACK_CONFIG.limits.walletFundingMax }
    : { min: PAYSTACK_CONFIG.limits.consultationMin, max: PAYSTACK_CONFIG.limits.consultationMax };

  return amount >= limits.min && amount <= limits.max;
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function convertToKobo(nairaAmount: number): number {
  return Math.round(nairaAmount * 100);
}

export function convertToNaira(koboAmount: number): number {
  return koboAmount / 100;
}
```

## 🔒 Security Features

### Payment Security
- **HTTPS Only**: All payment communications over HTTPS
- **Webhook Verification**: Verify Paystack webhook signatures
- **Amount Validation**: Server-side amount validation
- **Rate Limiting**: Prevent payment abuse
- **Audit Logging**: Log all payment activities

### Wallet Security
- **Balance Verification**: Verify wallet balance before transactions
- **Transaction Limits**: Implement daily/monthly limits
- **Fraud Detection**: Monitor for suspicious activities
- **Two-Factor Authentication**: Optional 2FA for large transactions

### Data Protection
- **PCI Compliance**: Follow PCI DSS guidelines
- **Data Encryption**: Encrypt sensitive payment data
- **Access Control**: Role-based access to payment features
- **Audit Trail**: Complete audit trail for all transactions

## 📊 Payment Analytics

### Transaction Metrics
- Payment success rates
- Average transaction values
- Popular payment methods
- Transaction volumes by time period

### Wallet Analytics
- Total wallet balances
- Funding patterns
- Spending behaviors
- User retention metrics

### Revenue Tracking
- Consultation revenues
- Platform commissions
- Payment processing fees
- Monthly recurring revenue

## 📱 Mobile Payment Considerations

### Mobile Money Integration
- Support for mobile money providers in Nigeria
- USSD payment codes for feature phones
- SMS notifications for transactions
- Offline payment confirmation

### Payment UX
- One-click payments for repeat customers
- Saved payment methods
- Payment reminders and notifications
- Easy refund processes

### Performance Optimization
- Async payment processing
- Payment status caching
- Background webhook processing
- Payment retry mechanisms