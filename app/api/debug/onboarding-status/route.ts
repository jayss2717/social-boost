import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    console.log('🔍 Debug onboarding status for shop:', shop);

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({
        status: 'NO_MERCHANT',
        message: 'No merchant found for this shop',
        shop,
        shouldRedirectToOAuth: true,
      });
    }

    return NextResponse.json({
      status: 'MERCHANT_FOUND',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        onboardingCompleted: merchant.onboardingCompleted,
        onboardingStep: merchant.onboardingStep,
        accessToken: merchant.accessToken ? 'SET' : 'MISSING',
        shopifyShopId: merchant.shopifyShopId,
        isActive: merchant.isActive,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
      },
      subscription: merchant.subscription ? {
        id: merchant.subscription.id,
        status: merchant.subscription.status,
        plan: merchant.subscription.plan ? {
          name: merchant.subscription.plan.name,
          ugcLimit: merchant.subscription.plan.ugcLimit,
          influencerLimit: merchant.subscription.plan.influencerLimit,
        } : null,
      } : null,
      settings: merchant.settings ? {
        id: merchant.settings.id,
        name: merchant.settings.name,
        email: merchant.settings.email,
      } : null,
      shouldRedirectToOnboarding: !merchant.onboardingCompleted,
      shouldRedirectToOAuth: merchant.accessToken === 'pending' || !merchant.shopifyShopId,
    });
  } catch (error) {
    console.error('❌ Debug onboarding status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 