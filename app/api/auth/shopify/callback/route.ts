import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify';
import { stripe } from '@/lib/stripe';
import { 
  withDatabaseRetry, 
  createErrorResponse, 
  createSuccessResponse,
  AppError,
  DatabaseError,
  ValidationError 
} from '@/utils/error-handling';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const hmac = searchParams.get('hmac');

  console.log('🔐 OAuth Callback triggered:', { 
    shop, 
    hasCode: !!code, 
    hasState: !!state,
    hasHmac: !!hmac,
    url: request.url 
  });

  if (!shop || !code) {
    console.error('❌ Missing required parameters:', { shop, hasCode: !!code });
    const errorUrl = shop ? `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?error=oauth_failed` : '/install';
    return NextResponse.redirect(errorUrl);
  }

  try {
    console.log('🔄 Starting OAuth token exchange for shop:', shop);
    
    // Exchange code for access token with retry logic
    const tokenData = await withDatabaseRetry(async () => {
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

      console.log('🔄 Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', errorText);
        throw new AppError(`Failed to exchange code for token: ${errorText}`, 401);
      }

      return await tokenResponse.json();
    }, 'token exchange');

    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;
    
    console.log('✅ Token exchange successful:', { 
      shop, 
      hasAccessToken: !!accessToken, 
      scope: scope?.substring(0, 50) + '...',
      tokenLength: accessToken?.length || 0
    });

    // Fetch shop data from Shopify with retry
    console.log('🔄 Fetching shop data from Shopify...');
    const shopData = await withDatabaseRetry(async () => {
      const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      console.log('🔄 Shop response status:', shopResponse.status);

      if (!shopResponse.ok) {
        const errorText = await shopResponse.text();
        console.error('❌ Failed to fetch shop data:', errorText);
        throw new AppError(`Failed to fetch shop data: ${errorText}`, 500);
      }

      return await shopResponse.json();
    }, 'shop data fetch');

    const shopInfo = shopData.shop;

    console.log('✅ Shop data fetched:', { 
      name: shopInfo.name, 
      email: shopInfo.email, 
      domain: shopInfo.domain,
      id: shopInfo.id,
      timezone: shopInfo.timezone
    });

    // Create or update merchant in database with comprehensive error handling
    let merchant;
    try {
      console.log('🔄 Starting merchant database operation...');
      
      merchant = await withDatabaseRetry(async () => {
        // First, try to find existing merchant
        const existingMerchant = await prisma.merchant.findUnique({
          where: { shop },
        });

        console.log('🔄 Existing merchant found:', !!existingMerchant);

        if (existingMerchant) {
          // Update existing merchant with OAuth data
          return await prisma.merchant.update({
            where: { shop },
            data: {
              accessToken,
              scope,
              shopifyShopId: shopInfo.id?.toString() || shopInfo.domain || shop,
              shopName: shopInfo.name,
              shopEmail: shopInfo.email,
              shopDomain: shopInfo.domain,
              shopCurrency: shopInfo.currency,
              shopTimezone: shopInfo.timezone,
              isActive: true,
            },
          });
        } else {
          // Create new merchant
          return await prisma.merchant.create({
            data: {
              shop,
              accessToken,
              scope,
              shopifyShopId: shopInfo.id?.toString() || shopInfo.domain || shop,
              shopName: shopInfo.name,
              shopEmail: shopInfo.email,
              shopDomain: shopInfo.domain,
              shopCurrency: shopInfo.currency,
              shopTimezone: shopInfo.timezone,
              isActive: true,
              onboardingCompleted: false,
            },
          });
        }
      }, 'merchant creation/update');

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
      console.error('❌ Failed to create/update merchant:', error);
      // If database fails, still redirect to onboarding
      const baseUrl = process.env.HOST || 'https://socialboost-blue.vercel.app';
      const onboardingUrl = `${baseUrl}/onboarding?shop=${shop}`;
      console.log('Database failed, redirecting to onboarding:', onboardingUrl);
      return NextResponse.redirect(onboardingUrl);
    }

    // Create Stripe customer automatically
    try {
      if (stripe && merchant) { // Check if merchant exists
        await withDatabaseRetry(async () => {
          // Check if customer already exists
          const existingCustomers = await stripe.customers.list({
            limit: 100,
          });
          
          const existingCustomer = existingCustomers.data.find(c => c.metadata?.shop === shop);
          
          if (!existingCustomer) {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
              email: merchant.shopEmail || `${shop.replace('.myshopify.com', '')}@example.com`,
              name: merchant.shopName || shop.replace('.myshopify.com', ''),
              metadata: {
                shop,
                merchantId: merchant.id,
                shopifyShopId: merchant.shopifyShopId || '',
              },
              description: `Shopify store: ${shop}`,
            });
            
            console.log('✅ Stripe customer created:', customer.id);
          } else {
            console.log('✅ Stripe customer already exists:', existingCustomer.id);
          }
        }, 'Stripe customer creation');
      }
    } catch (error) {
      console.error('❌ Failed to create Stripe customer:', error);
      // Continue with onboarding even if Stripe customer creation fails
    }

    // Create default subscription (Free plan) with retry
    try {
      await withDatabaseRetry(async () => {
        const freePlan = await prisma.plan.findUnique({
          where: { name: 'Free' },
        });

        if (!freePlan) {
          await prisma.plan.create({
            data: {
              name: 'Free',
              priceCents: 0,
              ugcLimit: 5,
              influencerLimit: 1,
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
      }, 'subscription creation');

      console.log('✅ Subscription created for merchant:', merchant.id);
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      // Continue with onboarding even if subscription creation fails
    }

    // Create default merchant settings with retry
    try {
      await withDatabaseRetry(async () => {
        await prisma.merchantSettings.upsert({
          where: { merchantId: merchant.id },
          update: {},
          create: {
            merchantId: merchant.id,
            name: merchant.shopName || shop.replace('.myshopify.com', ''),
            email: merchant.shopEmail || `admin@${shop}`,
            website: `https://${shop}`,
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
            },
          },
        });
      }, 'merchant settings creation');

      console.log('✅ Merchant settings created for merchant:', merchant.id);
    } catch (error) {
      console.error('❌ Failed to create merchant settings:', error);
      // Continue with onboarding even if settings creation fails
    }

    // Register webhooks for real-time order processing with retry
    try {
      await withDatabaseRetry(async () => {
        const shopifyAPI = new ShopifyAPI(accessToken, shop);
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : (process.env.HOST || 'https://socialboost-blue.vercel.app');
        
        await shopifyAPI.registerWebhooks(baseUrl);
      }, 'webhook registration');

      console.log('✅ Webhooks registered successfully');
    } catch (error) {
      console.error('❌ Failed to register webhooks:', error);
      // Continue with onboarding even if webhook registration fails
    }

    // Handle embedded app redirect
    if (state) {
      // This is an embedded app installation, redirect back to Shopify
      const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
      console.log('🔄 Embedded app: redirecting to Shopify:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect to onboarding if not completed, otherwise to app
    if (!merchant || !merchant.onboardingCompleted) {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.HOST || 'https://socialboost-blue.vercel.app');
      const onboardingUrl = `${baseUrl}/onboarding?shop=${shop}`;
      console.log('✅ Redirecting to onboarding:', onboardingUrl);
      return NextResponse.redirect(onboardingUrl);
    } else {
      const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
      console.log('✅ Redirecting to app:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }
    
  } catch (error) {
    console.error('❌ Shopify OAuth error:', error);
    
    // Handle specific error types
    if (error instanceof AppError) {
      console.error(`OAuth Error (${error.statusCode}):`, error.message);
    }
    
    // Redirect to app with error instead of returning JSON
    const errorUrl = shop ? `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}?error=oauth_failed` : '/install';
    return NextResponse.redirect(errorUrl);
  }
} 