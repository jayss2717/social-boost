import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    let merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        settings: true,
      },
    });

    // If merchant doesn't exist, create a new one for fresh installations
    if (!merchant) {
      console.log(`🔄 Creating new merchant for shop: ${shop}`);
      
      try {
        merchant = await prisma.merchant.create({
          data: {
            shop,
            accessToken: 'pending', // Will be updated during OAuth
            scope: 'read_products,write_products',
            shopifyShopId: null, // Will be updated during OAuth
            shopName: shop.replace('.myshopify.com', ''),
            shopEmail: `admin@${shop}`,
            shopDomain: shop,
            shopCurrency: 'USD',
            shopTimezone: 'America/New_York',
            shopLocale: 'en',
            onboardingCompleted: false,
            onboardingStep: 1,
            onboardingData: {
              businessType: 'ECOMMERCE',
              industry: 'General',
              goals: ['Increase brand awareness'],
              commissionRate: 10,
              autoApprove: false,
              minEngagement: 100,
              payoutSchedule: 'WEEKLY',
              teamSize: '1-5',
            },
          },
          include: {
            settings: true,
          },
        });

        // Get or create the Starter plan
        const starterPlan = await prisma.plan.upsert({
          where: { name: 'Starter' },
          update: {},
          create: {
            name: 'Starter',
            priceCents: 0,
            ugcLimit: 5,        // Updated to match Starter plan
            influencerLimit: 1,  // Updated to match Starter plan
          },
        });

        // Create default subscription
        await prisma.subscription.create({
          data: {
            merchantId: merchant.id,
            planId: starterPlan.id, // Use the actual plan ID
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        // Create default merchant settings
        await prisma.merchantSettings.create({
          data: {
            merchantId: merchant.id,
            name: merchant.shopName || shop.replace('.myshopify.com', ''),
            email: merchant.shopEmail || `admin@${shop}`,
            website: `https://${shop}`,
            linkPattern: '/discount/{code}',
            socialMedia: {
              instagram: '',
              tiktok: '',
              twitter: '',
              youtube: '',
            },
            discountSettings: {
              defaultPercentage: 15,
              minPercentage: 5,
              maxPercentage: 50,
              autoApprove: false,
            },
            commissionSettings: {
              defaultRate: 10,
              minRate: 5,
              maxRate: 25,
              autoPayout: false,
            },
            ugcSettings: {
              autoApprove: false,
              minEngagement: 100,
              hashtags: ['#sponsored'],
              timerSettings: {
                enabled: true,
                duration: 24, // hours
              },
            },
            payoutSettings: {
              autoPayout: false,
              schedule: 'WEEKLY',
              minimumAmount: 5000, // $50
            },
          },
        });

        console.log(`✅ Created new merchant: ${merchant.id}`);
        
        // Return the merchant ID in the response so it can be stored in localStorage
        const response = {
          id: merchant.id,
          shop: merchant.shop,
          accessToken: merchant.accessToken,
          shopifyShopId: merchant.shopifyShopId,
          scope: merchant.scope,
          shopName: merchant.shopName,
          shopEmail: merchant.shopEmail,
          shopDomain: merchant.shopDomain,
          shopCurrency: merchant.shopCurrency,
          shopTimezone: merchant.shopTimezone,
          shopLocale: merchant.shopLocale,
          isActive: merchant.isActive,
          onboardingCompleted: merchant.onboardingCompleted,
          onboardingStep: merchant.onboardingStep,
          onboardingData: merchant.onboardingData,
          settings: merchant.settings,
          _newMerchant: true, // Flag to indicate this is a new merchant
        };
        
        console.log('Merchant API response:', response);
        return NextResponse.json(response);
      } catch (createError) {
        console.error('Failed to create merchant:', createError);
        return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 });
      }
    }

    const response = {
      id: merchant.id,
      shop: merchant.shop,
      accessToken: merchant.accessToken,
      shopifyShopId: merchant.shopifyShopId,
      scope: merchant.scope,
      shopName: merchant.shopName,
      shopEmail: merchant.shopEmail,
      shopDomain: merchant.shopDomain,
      shopCurrency: merchant.shopCurrency,
      shopTimezone: merchant.shopTimezone,
      shopLocale: merchant.shopLocale,
      isActive: merchant.isActive,
      onboardingCompleted: merchant.onboardingCompleted,
      onboardingStep: merchant.onboardingStep,
      onboardingData: merchant.onboardingData,
      settings: merchant.settings,
    };
    
    console.log('Merchant API response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch merchant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 