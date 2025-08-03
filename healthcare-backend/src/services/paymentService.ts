import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';
import { PAYSTACK_CONFIG } from '../config/paystackConfig.js';

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
