import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { shop, shopName, shopEmail, shopDomain, shopCurrency, shopTimezone, shopLocale } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // In CI environment, return mock data
    if (process.env.CI === 'true') {
      return NextResponse.json({ 
        success: true, 
        message: 'Test merchant created successfully',
        merchant: {
          id: 'mock-merchant-id',
          shop: shop,
          onboardingCompleted: false,
        }
      });
    }

    // Generate a unique shopifyShopId based on the shop
    const shopifyShopId = `test_${shop.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;

    // Create or update merchant with test data
    const merchant = await prisma.merchant.upsert({
      where: { shop },
      update: {
        shopName,
        shopEmail,
        shopDomain,
        shopCurrency,
        shopTimezone,
        shopLocale,
        onboardingCompleted: false,
        onboardingStep: 0,
      },
      create: {
        shop,
        accessToken: 'test-access-token',
        scope: 'read_products,write_products',
        isActive: true,
        shopifyShopId,
        shopName,
        shopEmail,
        shopDomain,
        shopCurrency,
        shopTimezone,
        shopLocale,
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    // Create default subscription (Free plan)
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'Free' },
    });

    if (!freePlan) {
      await prisma.plan.create({
        data: {
          name: 'Free',
          priceCents: 0,
          ugcLimit: 20,
          influencerLimit: 5,
        },
      });
    }

    await prisma.subscription.upsert({
      where: { merchantId: merchant.id },
      update: {},
      create: {
        merchantId: merchant.id,
        planId: freePlan?.id || 'free-plan',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create initial merchant settings
    await prisma.merchantSettings.upsert({
      where: { merchantId: merchant.id },
      update: {},
      create: {
        merchantId: merchant.id,
        name: shopName,
        email: shopEmail,
        website: `https://${shopDomain}`,
        linkPattern: '/discount/{{code}}',
        socialMedia: {
          instagram: '',
          tiktok: '',
          twitter: '',
          youtube: '',
        },
        discountSettings: {
          defaultPercentage: 20,
          maxPercentage: 50,
          minPercentage: 5,
          autoApprove: false,
        },
        commissionSettings: {
          defaultRate: 10,
          maxRate: 25,
          minRate: 5,
          autoPayout: false,
        },
        ugcSettings: {
          autoApprove: false,
          minEngagement: 100,
          requiredHashtags: [],
          excludedWords: [],
          codeDelayHours: 2,
          codeDelayMinutes: 0,
          maxCodesPerDay: 50,
          maxCodesPerInfluencer: 1,
          discountType: 'PERCENTAGE',
          discountValue: 20,
          discountUsageLimit: 100,
        },
        payoutSettings: {
          autoPayout: false,
          payoutSchedule: 'WEEKLY',
          minimumPayout: 50,
          stripeAccountId: '',
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test merchant created successfully',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        onboardingCompleted: merchant.onboardingCompleted,
      }
    });
  } catch (error) {
    console.error('Failed to create test merchant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 