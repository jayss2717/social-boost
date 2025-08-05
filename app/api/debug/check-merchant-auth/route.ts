import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);
    
    if (!merchantId) {
      return Response.json({
        error: 'No merchant ID provided',
        headers: Object.fromEntries(request.headers.entries()),
        localStorage: 'Check browser console for localStorage.merchantId',
      }, { status: 401 });
    }

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        settings: true,
      },
    });

    if (!merchant) {
      return Response.json({
        error: 'Merchant not found',
        merchantId,
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        shopName: merchant.shopName,
        onboardingCompleted: merchant.onboardingCompleted,
      },
      subscription: merchant.subscription ? {
        status: merchant.subscription.status,
        plan: merchant.subscription.plan.name,
        currentPeriodEnd: merchant.subscription.currentPeriodEnd,
      } : null,
      settings: merchant.settings ? {
        name: merchant.settings.name,
        website: merchant.settings.website,
      } : null,
    });

  } catch (error) {
    console.error('Debug merchant auth error:', error);
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 