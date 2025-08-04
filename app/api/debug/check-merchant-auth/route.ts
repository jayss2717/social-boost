import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🔍 Checking merchant authentication for ${shop}`);

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({
        success: false,
        message: 'Merchant not found',
        shop,
        recommendations: ['Create merchant record for this shop'],
      });
    }

    // Check subscription status
    const subscriptionStatus = merchant.subscription ? {
      plan: merchant.subscription.plan?.name,
      status: merchant.subscription.status,
      limits: {
        ugcLimit: merchant.subscription.plan?.ugcLimit,
        influencerLimit: merchant.subscription.plan?.influencerLimit,
      },
    } : null;

    // Check if merchant ID is being sent in headers
    const merchantIdHeader = request.headers.get('x-merchant-id');
    const authStatus = {
      headerPresent: !!merchantIdHeader,
      headerValue: merchantIdHeader,
      matchesDatabase: merchantIdHeader === merchant.id,
    };

    const result = {
      success: true,
      message: 'Merchant authentication check completed',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        name: merchant.shopName,
        email: merchant.shopEmail,
        onboardingCompleted: merchant.onboardingCompleted,
      },
      subscription: subscriptionStatus,
      authentication: authStatus,
      recommendations: [],
    };

    // Generate recommendations
    if (!authStatus.headerPresent) {
      result.recommendations.push('Merchant ID header is missing from API calls');
    }

    if (authStatus.headerPresent && !authStatus.matchesDatabase) {
      result.recommendations.push('Merchant ID in header does not match database record');
    }

    if (!merchant.onboardingCompleted) {
      result.recommendations.push('Merchant onboarding is not completed');
    }

    if (!merchant.subscription) {
      result.recommendations.push('No subscription found for merchant');
    }

    console.log('🔍 Merchant authentication check results:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Merchant authentication check error:', error);
    return NextResponse.json(
      { error: 'Failed to check merchant authentication' },
      { status: 500 }
    );
  }
} 