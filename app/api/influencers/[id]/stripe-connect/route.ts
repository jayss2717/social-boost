import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';
import { createConnectedAccount, getAccountLink } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = requireMerchantId(request);
    const { id: influencerId } = params;

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

    // Check if influencer already has Stripe account
    if (influencer.stripeAccountId) {
      return createErrorResponse('Influencer already has a connected Stripe account', 400);
    }

    // Create Stripe Connect account
    const accountId = await createConnectedAccount(influencerId);
    
    if (!accountId) {
      return createErrorResponse('Failed to create Stripe Connect account', 500);
    }

    // Generate onboarding link
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/influencers/${influencerId}/stripe-connect/refresh`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/influencers/${influencerId}/stripe-connect/complete`;
    
    const accountLink = await getAccountLink(accountId, refreshUrl, returnUrl);
    
    if (!accountLink) {
      return createErrorResponse('Failed to generate onboarding link', 500);
    }

    return createSuccessResponse({
      accountId,
      onboardingUrl: accountLink,
      influencerId,
      status: 'PENDING_ONBOARDING',
    }, 'Stripe Connect account created successfully');
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to create Stripe Connect account', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = requireMerchantId(request);
    const { id: influencerId } = params;

    // Get influencer with Stripe account status
    const influencer = await prisma.influencer.findFirst({
      where: {
        id: influencerId,
        merchantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        stripeAccountId: true,
        commissionRate: true,
        createdAt: true,
      },
    });

    if (!influencer) {
      return createErrorResponse('Influencer not found', 404);
    }

    // Get account status from Stripe if account exists
    let accountStatus = 'NOT_CONNECTED';
    let accountDetails = null;

    if (influencer.stripeAccountId) {
      try {
        const { stripe } = await import('@/lib/stripe');
        const account = await stripe.accounts.retrieve(influencer.stripeAccountId);
        
        accountStatus = account.charges_enabled ? 'ACTIVE' : 'PENDING_VERIFICATION';
        accountDetails = {
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirements: account.requirements,
          businessProfile: account.business_profile,
        };
      } catch (error) {
        console.error('Failed to retrieve Stripe account:', error);
        accountStatus = 'ERROR';
      }
    }

    return createSuccessResponse({
      influencer,
      stripeAccount: {
        status: accountStatus,
        details: accountDetails,
      },
    });
  } catch (error) {
    console.error('Failed to get Stripe Connect status:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to get Stripe Connect status', 500);
  }
} 