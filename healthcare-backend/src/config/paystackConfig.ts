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
