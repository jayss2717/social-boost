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

export const calculateCommission = (
  salesAmount: number,
  commissionRate: number,
  discountAmount: number = 0
): number => {
  const netSales = salesAmount - discountAmount;
  return Math.round(netSales * (commissionRate / 100));
};

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
      },
    });

    return transfer;
  } catch (error) {
    // Update payout status to failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
      },
    });

    throw error;
  }
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