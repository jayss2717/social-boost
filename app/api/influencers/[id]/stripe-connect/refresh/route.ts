import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';
import { getAccountLink } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(
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

    if (!influencer.stripeAccountId) {
      return createErrorResponse('No Stripe account found for influencer', 400);
    }

    // Generate new onboarding link
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/influencers/${influencerId}/stripe-connect/refresh`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/influencers/${influencerId}/stripe-connect/complete`;
    
    const accountLink = await getAccountLink(influencer.stripeAccountId, refreshUrl, returnUrl);
    
    if (!accountLink) {
      return createErrorResponse('Failed to generate new onboarding link', 500);
    }

    return createSuccessResponse({
      onboardingUrl: accountLink,
      influencerId,
      accountId: influencer.stripeAccountId,
    }, 'New onboarding link generated successfully');
  } catch (error) {
    console.error('Failed to refresh Stripe Connect onboarding:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to refresh Stripe Connect onboarding', 500);
  }
} 