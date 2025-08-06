import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    console.log(`🔍 Merchant API called with shop: ${shop}, host: ${host}`);
    console.log(`🔍 Request URL: ${request.url}`);
    console.log(`🔍 User Agent: ${request.headers.get('user-agent')}`);
    console.log(`🔍 Referer: ${request.headers.get('referer')}`);

    if (!shop && !host) {
      console.log(`❌ Missing shop and host parameters`);
      return NextResponse.json({ error: 'Missing shop or host parameter' }, { status: 400 });
    }

    // Use shop parameter if available, otherwise try to extract from host
    const shopDomain = shop || (host ? `${host.replace('.myshopify.com', '')}.myshopify.com` : null);
    
    if (!shopDomain) {
      console.log(`❌ Could not determine shop domain from shop: ${shop}, host: ${host}`);
      return NextResponse.json({ error: 'Could not determine shop domain' }, { status: 400 });
    }

    console.log(`🔍 Looking for merchant with shop: ${shopDomain}`);

    let merchant = await prisma.merchant.findUnique({
      where: { shop: shopDomain },
      include: {
        settings: true,
      },
    });

    if (merchant) {
      console.log(`✅ Found existing merchant: ${merchant.id} for shop: ${shopDomain}`);
      return NextResponse.json(merchant);
    }

    // If merchant doesn't exist, create a new one for fresh installations
    console.log(`🔄 Creating new merchant for shop: ${shopDomain}`);
    console.log(`🔄 This is a fresh installation or new store`);
    
    try {
      merchant = await prisma.merchant.create({
        data: {
          shop: shopDomain,
          accessToken: 'pending', // Will be updated during OAuth
          scope: 'read_products,write_products',
          shopifyShopId: null, // Will be updated during OAuth
          shopName: shopDomain.replace('.myshopify.com', ''),
          shopEmail: `admin@${shopDomain}`,
          shopDomain: shopDomain,
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

      console.log(`✅ Successfully created merchant: ${merchant.id} for shop: ${shopDomain}`);

      // Get or create the Starter plan
      const starterPlan = await prisma.plan.upsert({
        where: { name: 'STARTER' },
        update: {},
        create: {
          name: 'STARTER',
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
          name: merchant.shopName || shopDomain.replace('.myshopify.com', ''),
          email: merchant.shopEmail || `admin@${shopDomain}`,
          website: `https://${shopDomain}`,
          linkPattern: '/discount/{code}',
          socialMedia: {
            instagram: '',
            tiktok: '',
            twitter: '',
            youtube: '',
          },
          discountSettings: {
            defaultPercentage: 20,
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
            autoDetect: true,
            autoApprove: false,
            minEngagement: 100,
            rewardType: 'DISCOUNT_CODE',
            rewardValue: 10,
          },
          payoutSettings: {
            autoPayout: false,
            minimumPayout: 50,
            payoutSchedule: 'WEEKLY',
            payoutDay: 1,
          },
        },
      });

      console.log(`✅ Successfully created all associated data for merchant: ${merchant.id}`);

      return NextResponse.json(merchant);
    } catch (createError) {
      console.error(`❌ Error creating merchant for shop: ${shopDomain}`, createError);
      
      // Check if merchant was created by another request
      const existingMerchant = await prisma.merchant.findUnique({
        where: { shop: shopDomain },
        include: {
          settings: true,
        },
      });
      
      if (existingMerchant) {
        console.log(`✅ Found merchant created by another request: ${existingMerchant.id}`);
        return NextResponse.json(existingMerchant);
      }
      
      return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Merchant API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 