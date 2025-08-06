import Stripe from 'stripe';
import { prisma } from './prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface PayoutData {
  influencerId: string;
  amount: number; // in cents
  commissionRate: number;
  salesAmount: number;
  description?: string;
}

export interface StripePayoutResult {
  success: boolean;
  payoutId?: string;
  error?: string;
}

export async function createStripePayout(payoutData: PayoutData): Promise<StripePayoutResult> {
  try {
    // Get influencer details
    const influencer = await prisma.influencer.findUnique({
      where: { id: payoutData.influencerId },
      include: { merchant: true },
    });

    if (!influencer) {
      return { success: false, error: 'Influencer not found' };
    }

    // Check if influencer has Stripe account
    if (!influencer.stripeAccountId) {
      return { success: false, error: 'Influencer does not have a connected Stripe account' };
    }

    // Create payout in Stripe
    const payout = await stripe.transfers.create({
      amount: payoutData.amount,
      currency: 'usd',
      destination: influencer.stripeAccountId,
      description: payoutData.description || `Commission payout for ${influencer.name}`,
      metadata: {
        influencerId: payoutData.influencerId,
        merchantId: influencer.merchantId,
        commissionRate: payoutData.commissionRate.toString(),
        salesAmount: payoutData.salesAmount.toString(),
      },
    });

    // Create payout record in database
    const dbPayout = await prisma.payout.create({
      data: {
        influencerId: payoutData.influencerId,
        amount: payoutData.amount,
        stripeTransferId: payout.id,
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(),
        merchantId: influencer.merchantId,
      },
    });

    return { success: true, payoutId: dbPayout.id };
  } catch (error) {
    console.error('Failed to create Stripe payout:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function processBulkPayouts(payoutIds: string[]): Promise<StripePayoutResult[]> {
  const results: StripePayoutResult[] = [];

  for (const payoutId of payoutIds) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { influencer: true },
    });

    if (!payout) {
      results.push({ success: false, error: 'Payout not found' });
      continue;
    }

    if (payout.status !== 'PENDING') {
      results.push({ success: false, error: 'Payout is not in pending status' });
      continue;
    }

    const result = await createStripePayout({
      influencerId: payout.influencerId,
      amount: payout.amount,
      commissionRate: 0.1, // Default commission rate
      salesAmount: payout.amount * 10, // Estimate sales amount
      description: `Commission payout for ${payout.influencer.name}`,
    });

    results.push(result);
  }

  return results;
}

export async function updatePayoutStatus(stripeTransferId: string, status: string): Promise<void> {
  await prisma.payout.updateMany({
    where: { stripeTransferId: stripeTransferId },
    data: { status: status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' },
  });
}

export async function calculateCommission(
  orderAmount: number,
  commissionRate: number,
  discountCode?: string
): Promise<number> {
  // Calculate commission based on order amount and commission rate
  let commission = orderAmount * commissionRate;

  // If discount code was used, adjust commission
  if (discountCode) {
    // Reduce commission proportionally based on discount
    const discountCodeRecord = await prisma.discountCode.findFirst({
      where: { code: discountCode },
    });

    if (discountCodeRecord) {
      const discountAmount = discountCodeRecord.discountType === 'PERCENTAGE' 
        ? (orderAmount * discountCodeRecord.discountValue / 100)
        : discountCodeRecord.discountValue;
      
      // Adjust commission based on discount
      commission = commission * (1 - (discountAmount / orderAmount));
    }
  }

  return Math.round(commission); // Round to nearest cent
}

export async function createConnectedAccount(influencerId: string): Promise<string | null> {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) {
      console.error('Influencer not found:', influencerId);
      throw new Error('Influencer not found');
    }

    console.log('Creating Stripe Connect account for influencer:', influencer.name, influencer.email);

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default, can be made configurable
      email: influencer.email || 'influencer@example.com',
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        url: 'https://socialboost.com',
        mcc: '5734', // Computer Software Stores
      },
    });

    console.log('Stripe account created:', account.id);

    // Update influencer with Stripe account ID
    await prisma.influencer.update({
      where: { id: influencerId },
      data: { stripeAccountId: account.id },
    });

    console.log('Influencer updated with Stripe account ID');

    return account.id;
  } catch (error) {
    console.error('Failed to create connected account:', error);
    return null;
  }
}

export async function getAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string | null> {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  } catch (error) {
    console.error('Failed to create account link:', error);
    return null;
  }
}

export async function handlePayoutWebhook(event: Stripe.Event): Promise<void> {
  try {
    const eventType = event.type;
    const transferId = (event.data.object as Record<string, unknown>).id as string;
    
    if (eventType.includes('transfer')) {
      let status = 'PENDING';
      
      if (eventType.includes('paid')) {
        status = 'COMPLETED';
      } else if (eventType.includes('failed')) {
        status = 'FAILED';
      } else if (eventType.includes('updated')) {
        status = 'PROCESSING';
      }
      
      await updatePayoutStatus(transferId, status);
    }
  } catch (error) {
    console.error('Failed to handle payout webhook:', error);
  }
}

export { stripe }; 