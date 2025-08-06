import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export interface PayoutCalculation {
  influencerId: string;
  amount: number; // in cents
  commissionRate: number;
  salesAmount: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface CommissionCalculationParams {
  originalAmount: number;
  discountedAmount: number;
  commissionRate: number;
  calculationBase: 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT';
}

export interface CommissionCalculationResult {
  commissionAmount: number;
  calculationBase: 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT';
  baseAmount: number;
  commissionRate: number;
}

/**
 * Calculate commission based on merchant's preference
 */
export function calculateCommission(params: CommissionCalculationParams): CommissionCalculationResult {
  const { originalAmount, discountedAmount, commissionRate, calculationBase } = params;
  
  let baseAmount: number;
  
  if (calculationBase === 'DISCOUNTED_AMOUNT') {
    baseAmount = discountedAmount;
  } else {
    baseAmount = originalAmount;
  }
  
  const commissionAmount = baseAmount * (commissionRate / 100);
  
  return {
    commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimal places
    calculationBase,
    baseAmount,
    commissionRate,
  };
}

/**
 * Example usage:
 * 
 * // For a $100 order with 20% discount and 5% commission
 * const result = calculateCommission({
 *   originalAmount: 100,
 *   discountedAmount: 80,
 *   commissionRate: 5,
 *   calculationBase: 'DISCOUNTED_AMOUNT' // or 'ORIGINAL_AMOUNT'
 * });
 * 
 * // Result:
 * // - DISCOUNTED_AMOUNT: $4.00 commission (5% of $80)
 * // - ORIGINAL_AMOUNT: $5.00 commission (5% of $100)
 */

export const createPayoutRecord = async (
  merchantId: string,
  calculation: PayoutCalculation
) => {
  return await prisma.payout.create({
    data: {
      merchantId,
      influencerId: calculation.influencerId,
      amount: calculation.amount,
      status: 'PENDING',
      periodStart: calculation.periodStart,
      periodEnd: calculation.periodEnd,
    },
    include: { influencer: true },
  });
};

export const processPayoutViaStripe = async (payoutId: string) => {
  // Check if Stripe is configured
  if (!stripe) {
    throw new Error('Stripe not configured for payout processing');
  }

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { influencer: true },
  });

  if (!payout) {
    throw new Error('Payout not found');
  }

  if (!payout.influencer.stripeAccountId) {
    throw new Error('Influencer has no Stripe account connected');
  }

  try {
    // Create transfer to influencer's Stripe account
    const transfer = await stripe.transfers.create({
      amount: payout.amount,
      currency: 'usd',
      destination: payout.influencer.stripeAccountId,
      description: `Commission payout for ${payout.influencer.name}`,
      metadata: {
        payoutId: payout.id,
        influencerId: payout.influencerId,
        merchantId: payout.merchantId,
      },
    });

    // Update payout record
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        stripeTransferId: transfer.id,
        processedAt: new Date(),
      },
    });

    return transfer;
  } catch (error) {
    // Update payout status to failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
      },
    });

    throw error;
  }
};

export const checkAutoPayoutConditions = async (merchantId: string, influencerId: string) => {
  // Get merchant settings
  const merchantSettings = await prisma.merchantSettings.findUnique({
    where: { merchantId },
  });

  if (!merchantSettings?.payoutSettings?.autoPayout) {
    return { shouldProcess: false, reason: 'Auto-payout disabled' };
  }

  // Get influencer's pending payouts
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      merchantId,
      influencerId,
      status: 'PENDING',
    },
  });

  const totalPendingAmount = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0) / 100; // Convert from cents
  const minimumAmount = merchantSettings.payoutSettings.minimumPayoutAmount;

  if (totalPendingAmount >= minimumAmount) {
    return { 
      shouldProcess: true, 
      reason: `Threshold met: $${totalPendingAmount.toFixed(2)} >= $${minimumAmount}`,
      totalAmount: totalPendingAmount,
      payoutIds: pendingPayouts.map(p => p.id),
    };
  }

  return { 
    shouldProcess: false, 
    reason: `Threshold not met: $${totalPendingAmount.toFixed(2)} < $${minimumAmount}`,
    totalAmount: totalPendingAmount,
  };
};

export const processAutoPayouts = async (merchantId: string) => {
  // Get merchant settings
  const merchantSettings = await prisma.merchantSettings.findUnique({
    where: { merchantId },
  });

  if (!merchantSettings?.payoutSettings?.autoPayout) {
    return { processed: 0, skipped: 0, errors: [] };
  }

  // Get all influencers with pending payouts
  const influencersWithPayouts = await prisma.influencer.findMany({
    where: {
      merchantId,
      payouts: {
        some: {
          status: 'PENDING',
        },
      },
    },
    include: {
      payouts: {
        where: { status: 'PENDING' },
      },
    },
  });

  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const influencer of influencersWithPayouts) {
    try {
      const autoPayoutCheck = await checkAutoPayoutConditions(merchantId, influencer.id);
      
      if (autoPayoutCheck.shouldProcess) {
        // Process all pending payouts for this influencer
        for (const payout of influencer.payouts) {
          try {
            await processPayoutViaStripe(payout.id);
            results.processed++;
          } catch (error) {
            results.errors.push(`Payout ${payout.id}: ${error}`);
          }
        }
      } else {
        results.skipped++;
      }
    } catch (error) {
      results.errors.push(`Influencer ${influencer.id}: ${error}`);
    }
  }

  return results;
};

export const processBulkPayouts = async (merchantId: string) => {
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      merchantId,
      status: 'PENDING',
    },
    include: { influencer: true },
  });

  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const payout of pendingPayouts) {
    try {
      await processPayoutViaStripe(payout.id);
      results.processed++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Payout ${payout.id}: ${error}`);
    }
  }

  return results;
};

export const getPayoutSummary = async (merchantId: string) => {
  const payouts = await prisma.payout.findMany({
    where: { merchantId },
    include: { influencer: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const pendingAmount = payouts
    .filter(payout => payout.status === 'PENDING')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const completedAmount = payouts
    .filter(payout => payout.status === 'COMPLETED')
    .reduce((sum, payout) => sum + payout.amount, 0);

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