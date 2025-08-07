import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/api';
import { requireMerchantId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = requireMerchantId(request);
    const { id: influencerId } = params;
    const { searchParams } = new URL(request.url);
    
    // Get the account_id from Stripe's redirect
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return createErrorResponse('No account ID provided', 400);
    }

    // Verify influencer belongs to merchant
    const influencer = await prisma.influencer.findFirst({
      where: {
        id: influencerId,
        merchantId,
      },
    });

    if (!influencer) {
      return createErrorResponse('Influencer not found', 404);
    }

    // Verify the account ID matches
    if (influencer.stripeAccountId !== accountId) {
      return createErrorResponse('Account ID mismatch', 400);
    }

    // Get account status from Stripe
    try {
      const { stripe } = await import('@/lib/stripe');
      const account = await stripe.accounts.retrieve(accountId);
      
      const accountStatus = account.charges_enabled ? 'ACTIVE' : 'PENDING_VERIFICATION';
      
      return createSuccessResponse({
        influencerId,
        accountId,
        status: accountStatus,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
      }, 'Stripe Connect onboarding completed successfully');
    } catch (error) {
      console.error('Failed to verify Stripe account:', error);
      return createErrorResponse('Failed to verify Stripe account', 500);
    }
  } catch (error) {
    console.error('Failed to complete Stripe Connect onboarding:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to complete Stripe Connect onboarding', 500);
  }
} 