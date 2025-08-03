import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    // const state = searchParams.get('state'); // Unused for now

    console.log('🔐 OAuth Callback triggered:', { shop, code: code ? '***' : 'missing' });

    if (!shop || !code) {
      console.error('❌ Missing required parameters:', { shop, hasCode: !!code });
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
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;
    
    console.log('✅ Token exchange successful:', { 
      shop, 
      hasAccessToken: !!accessToken, 
      scope: scope?.substring(0, 50) + '...' 
    });

    // Fetch shop data from Shopify
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!shopResponse.ok) {
      console.error('❌ Failed to fetch shop data');
      return NextResponse.json({ error: 'Failed to fetch shop data' }, { status: 500 });
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    console.log('✅ Shop data fetched:', { 
      name: shopInfo.name, 
      email: shopInfo.email, 
      domain: shopInfo.domain 
    });

    // Create or update merchant in database
    let merchant;
    try {
      // First, try to find existing merchant
      const existingMerchant = await prisma.merchant.findUnique({
        where: { shop },
      });

      if (existingMerchant) {
        // Update existing merchant with OAuth data
        merchant = await prisma.merchant.update({
          where: { shop },
          data: {
            accessToken,
            scope,
            shopifyShopId: shopInfo.id?.toString() || shopInfo.domain || shop, // Set shopifyShopId
            shopName: shopInfo.name,
            shopEmail: shopInfo.email,
            shopDomain: shopInfo.domain,
            shopCurrency: shopInfo.currency,
            shopTimezone: shopInfo.timezone,
            isActive: true,
          },
        });
        console.log('✅ Updated existing merchant with OAuth data');
      } else {
        // Create new merchant
        merchant = await prisma.merchant.create({
          data: {
            shop,
            accessToken,
            scope,
            shopifyShopId: shopInfo.id?.toString() || shopInfo.domain || shop, // Set shopifyShopId
            shopName: shopInfo.name,
            shopEmail: shopInfo.email,
            shopDomain: shopInfo.domain,
            shopCurrency: shopInfo.currency,
            shopTimezone: shopInfo.timezone,
            isActive: true,
            onboardingCompleted: false,
          },
        });
        console.log('✅ Created new merchant with OAuth data');
      }

          console.log('✅ Merchant created/updated:', {
      id: merchant.id,
      shop: merchant.shop,
      accessToken: merchant.accessToken ? '***SET***' : 'MISSING',
      shopifyShopId: merchant.shopifyShopId,
      shopEmail: merchant.shopEmail,
      shopDomain: merchant.shopDomain,
      shopCurrency: merchant.shopCurrency,
      onboardingCompleted: merchant.onboardingCompleted,
    });
    } catch (error) {
      console.error('Failed to create/update merchant:', error);
      // If database fails, still redirect to onboarding
      const baseUrl = process.env.HOST || 'https://socialboost-blue.vercel.app';
      const onboardingUrl = `${baseUrl}/onboarding?shop=${shop}`;
      console.log('Database failed, redirecting to onboarding:', onboardingUrl);
      return NextResponse.redirect(onboardingUrl);
    }

    // Create default subscription (Free plan)
    try {
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
      console.log('Subscription created for merchant:', merchant.id);
    } catch (error) {
      console.error('Failed to create subscription:', error);
      // Continue with onboarding even if subscription creation fails
    }

    // Create initial merchant settings with Shopify data
    try {
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
      console.log('Merchant settings created for merchant:', merchant.id);
    } catch (error) {
      console.error('Failed to create merchant settings:', error);
      // Continue with onboarding even if settings creation fails
    }

    // Register webhooks for real-time order processing
    try {
      const shopifyAPI = new ShopifyAPI(accessToken, shop);
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.HOST || 'https://socialboost-blue.vercel.app');
      
      await shopifyAPI.registerWebhooks(baseUrl);
      console.log('✅ Webhooks registered successfully');
    } catch (error) {
      console.error('Failed to register webhooks:', error);
      // Continue with onboarding even if webhook registration fails
    }

    // Handle embedded app redirect
    const state = searchParams.get('state');
    if (state) {
      // This is an embedded app installation, redirect back to Shopify
      const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
      console.log('🔄 Embedded app: redirecting to Shopify:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect to onboarding if not completed, otherwise to app
    // For new installations, always redirect to onboarding
    if (!merchant || !merchant.onboardingCompleted) {
      // Use Vercel URL for production, localhost for development
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.HOST || 'https://socialboost-blue.vercel.app');
      const onboardingUrl = `${baseUrl}/onboarding?shop=${shop}`;
      console.log('Redirecting to onboarding:', onboardingUrl);
      return NextResponse.redirect(onboardingUrl);
    } else {
      const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
      console.log('Redirecting to app:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Fallback: if we get here, always redirect to onboarding
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : (process.env.HOST || 'https://socialboost-blue.vercel.app');
    const onboardingUrl = `${baseUrl}/onboarding?shop=${shop}`;
    console.log('Fallback: redirecting to onboarding:', onboardingUrl);
    return NextResponse.redirect(onboardingUrl);
  } catch (error) {
    console.error('Shopify OAuth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 