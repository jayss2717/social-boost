import { prisma } from '@/lib/prisma';

export interface CommissionCalculationParams {
  originalAmount: number;
  discountedAmount: number;
  commissionRate: number;
  calculationBase: 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT';
}

export interface CommissionCalculationResult {
  commissionAmount: number;
  calculationBase: 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT';
  originalAmount: number;
  discountedAmount: number;
  commissionRate: number;
}

export function calculateCommission(params: CommissionCalculationParams): CommissionCalculationResult {
  const { originalAmount, discountedAmount, commissionRate, calculationBase } = params;
  
  let baseAmount: number;
  
  if (calculationBase === 'DISCOUNTED_AMOUNT') {
    baseAmount = discountedAmount;
  } else {
    baseAmount = originalAmount;
  }
  
  const commissionAmount = baseAmount * commissionRate;
  
  return {
    commissionAmount,
    calculationBase,
    originalAmount,
    discountedAmount,
    commissionRate,
  };
}

export async function createPayout(params: {
  merchantId: string;
  influencerId: string;
  orderId: string;
  originalAmount: number;
  discountedAmount: number;
  commissionAmount: number;
  commissionRate: number;
  discountCode: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}) {
  const {
    merchantId,
    influencerId,
    orderId,
    originalAmount,
    discountedAmount,
    commissionAmount,
    commissionRate,
    discountCode,
    status,
  } = params;

  return await prisma.payout.create({
    data: {
      merchantId,
      influencerId,
      orderId,
      originalAmount,
      discountedAmount,
      commissionAmount,
      commissionRate,
      discountCode,
      status,
      periodStart: new Date(),
      periodEnd: new Date(),
    },
  });
}

export async function processPayoutViaStripe(payoutId: string, merchantId: string) {
  try {
    // Get payout with influencer details
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        influencer: true,
      },
    });

    if (!payout || !payout.influencer.stripeAccountId) {
      console.error('Payout or Stripe account not found:', payoutId);
      return { success: false, error: 'Payout or Stripe account not found' };
    }

    // Import Stripe
    const { stripe } = await import('@/lib/stripe');

    // Create transfer to influencer's Stripe account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.commissionAmount * 100), // Convert to cents
      currency: 'usd',
      destination: payout.influencer.stripeAccountId,
      description: `Commission for order ${payout.orderId} - ${payout.discountCode}`,
      metadata: {
        payoutId: payout.id,
        orderId: payout.orderId,
        influencerId: payout.influencerId,
        discountCode: payout.discountCode,
      },
    });

    // Update payout status
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        stripeTransferId: transfer.id,
        processedAt: new Date(),
      },
    });

    return { success: true, transferId: transfer.id };
  } catch (error) {
    console.error('Error processing payout via Stripe:', error);
    
    // Update payout status to failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
      },
    });

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const checkAutoPayoutConditions = async (merchantId: string, influencerId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { merchantSettings: true },
  });

  if (!merchant?.merchantSettings?.payoutSettings?.autoPayout) {
    return false;
  }

  const minimumAmount = merchant.merchantSettings.payoutSettings.minimumPayoutAmount || 0;
  
  // Get total pending payouts for this influencer
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      merchantId,
      influencerId,
      status: 'PENDING',
    },
  });

  const totalAmount = pendingPayouts.reduce((sum, payout) => sum + payout.commissionAmount, 0);
  
  return totalAmount >= minimumAmount;
};

export const processAutoPayouts = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { merchantSettings: true },
  });

  if (!merchant?.merchantSettings?.payoutSettings?.autoPayout) {
    return { processed: 0, skipped: 0, errors: [] };
  }

  const minimumAmount = merchant.merchantSettings.payoutSettings.minimumPayoutAmount || 0;
  
  // Get all pending payouts for this merchant
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      merchantId,
      status: 'PENDING',
    },
    include: {
      influencer: true,
    },
  });

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Group payouts by influencer
  const payoutsByInfluencer = pendingPayouts.reduce((acc, payout) => {
    if (!acc[payout.influencerId]) {
      acc[payout.influencerId] = [];
    }
    acc[payout.influencerId].push(payout);
    return acc;
  }, {} as Record<string, typeof pendingPayouts>);

  // Process each influencer's payouts
  for (const [influencerId, payouts] of Object.entries(payoutsByInfluencer)) {
    const totalAmount = payouts.reduce((sum, payout) => sum + payout.commissionAmount, 0);
    
    if (totalAmount >= minimumAmount) {
      // Process all payouts for this influencer
      for (const payout of payouts) {
        const result = await processPayoutViaStripe(payout.id, merchantId);
        if (result.success) {
          processed++;
        } else {
          errors.push(`Failed to process payout ${payout.id}: ${result.error}`);
        }
      }
    } else {
      skipped += payouts.length;
    }
  }

  return { processed, skipped, errors };
};

export const processBulkPayouts = async (merchantId: string) => {
  // Get all pending payouts for this merchant
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      merchantId,
      status: 'PENDING',
    },
    include: {
      influencer: true,
    },
  });

  let processed = 0;
  const errors: string[] = [];

  // Process each payout
  for (const payout of pendingPayouts) {
    const result = await processPayoutViaStripe(payout.id, merchantId);
    if (result.success) {
      processed++;
    } else {
      errors.push(`Failed to process payout ${payout.id}: ${result.error}`);
    }
  }

  return { processed, skipped: 0, errors };
};

export const getPayoutSummary = async (merchantId: string) => {
  const payouts = await prisma.payout.findMany({
    where: { merchantId },
    include: { influencer: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalAmount = payouts.reduce((sum, payout) => sum + payout.commissionAmount, 0);
  const pendingAmount = payouts
    .filter(payout => payout.status === 'PENDING')
    .reduce((sum, payout) => sum + payout.commissionAmount, 0);
  const completedAmount = payouts
    .filter(payout => payout.status === 'COMPLETED')
    .reduce((sum, payout) => sum + payout.commissionAmount, 0);

  return {
    totalAmount,
    pendingAmount,
    completedAmount,
    totalPayouts: payouts.length,
    pendingPayouts: payouts.filter(p => p.status === 'PENDING').length,
    completedPayouts: payouts.filter(p => p.status === 'COMPLETED').length,
    payouts,
  };
};

export const createStripeConnectAccount = async (email: string) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  return await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });
};

export const generateConnectAccountLink = async (accountId: string) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  return await stripe.accounts.createLoginLink(accountId);
}; 