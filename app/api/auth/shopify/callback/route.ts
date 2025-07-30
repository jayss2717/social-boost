import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!shop || !code) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    // Fetch shop data from Shopify
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!shopResponse.ok) {
      console.error('Failed to fetch shop data:', await shopResponse.text());
      return NextResponse.json({ error: 'Failed to fetch shop data' }, { status: 500 });
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    // Create or update merchant with Shopify data
    const merchant = await prisma.merchant.upsert({
      where: { shop },
      update: {
        accessToken,
        scope,
        isActive: true,
        shopifyShopId: shopInfo.id.toString(),
        shopName: shopInfo.name,
        shopEmail: shopInfo.email,
        shopDomain: shopInfo.domain,
        shopCurrency: shopInfo.currency,
        shopTimezone: shopInfo.iana_timezone,
        shopLocale: shopInfo.locale,
      },
      create: {
        shop,
        accessToken,
        scope,
        isActive: true,
        shopifyShopId: shopInfo.id.toString(),
        shopName: shopInfo.name,
        shopEmail: shopInfo.email,
        shopDomain: shopInfo.domain,
        shopCurrency: shopInfo.currency,
        shopTimezone: shopInfo.iana_timezone,
        shopLocale: shopInfo.locale,
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

    // Create initial merchant settings with Shopify data
    await prisma.merchantSettings.upsert({
      where: { merchantId: merchant.id },
      update: {},
      create: {
        merchantId: merchant.id,
        name: shopInfo.name,
        email: shopInfo.email,
        website: `https://${shopInfo.domain}`,
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

    // Redirect to onboarding if not completed, otherwise to app
    if (!merchant.onboardingCompleted) {
      const onboardingUrl = `${process.env.HOST || 'http://localhost:3000'}/onboarding?shop=${shop}`;
      return NextResponse.redirect(onboardingUrl);
    } else {
      const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Shopify OAuth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 