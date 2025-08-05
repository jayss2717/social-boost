import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupFreshAccount() {
  console.log('Setting up fresh account data...');
  
  try {
    // Create a test plan first
    const starterPlan = await prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        priceCents: 0, // Free plan
        ugcLimit: 5,
        influencerLimit: 1,
      },
    });

    console.log('Created/updated Starter plan:', starterPlan.id);

    // Generate a unique shop name with timestamp
    const timestamp = Date.now();
    const uniqueShop = `fresh-shop-${timestamp}.myshopify.com`;

    // Create a test merchant with unique shop name
    const merchant = await prisma.merchant.create({
      data: {
        shop: uniqueShop,
        accessToken: 'test-access-token',
        scope: 'read_products,write_products',
        shopName: 'Fresh Test Shop',
        shopEmail: 'fresh@example.com',
        shopDomain: uniqueShop,
        shopCurrency: 'USD',
        shopTimezone: 'America/New_York',
        shopLocale: 'en',
        onboardingCompleted: true,
        onboardingStep: 3,
      },
    });

    console.log('Created fresh merchant:', merchant.id);
    console.log('Shop:', uniqueShop);

    // Create merchant settings
    const merchantSettings = await prisma.merchantSettings.create({
      data: {
        merchantId: merchant.id,
        name: 'Fresh Test Merchant',
        email: 'fresh@example.com',
        website: `https://${uniqueShop}`,
        linkPattern: '/discount/{code}',
        socialMedia: {
          instagram: '@freshtestshop',
          tiktok: '@freshtestshop',
          twitter: '@freshtestshop',
          youtube: '@freshtestshop',
        },
        discountSettings: {
          defaultPercentage: 10,
          minPercentage: 5,
          maxPercentage: 25,
          autoApprove: false,
        },
        commissionSettings: {
          defaultRate: 0.1,
          minRate: 0.05,
          maxRate: 0.2,
          autoPayout: false,
        },
        ugcSettings: {
          autoApprove: false,
          minEngagement: 10,
          hashtags: ['#freshtestshop', '#sponsored'],
          timerSettings: {
            enabled: true,
            duration: 24,
          },
        },
        payoutSettings: {
          autoPayout: false,
          schedule: 'monthly',
          minimumAmount: 1000, // $10.00 in cents
        },
      },
    });

    console.log('Created merchant settings:', merchantSettings.id);

    // Create a subscription for the merchant
    const subscription = await prisma.subscription.create({
      data: {
        merchantId: merchant.id,
        planId: starterPlan.id,
        stripeSubId: `sub_fresh_${timestamp}`,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    console.log('Created subscription:', subscription.id);

    console.log('\n=== Fresh Account Setup Complete ===');
    console.log('Merchant ID:', merchant.id);
    console.log('Shop:', uniqueShop);
    console.log('Plan:', starterPlan.name);
    console.log('\nTo use this in your app:');
    console.log('1. Open browser console');
    console.log('2. Run: localStorage.setItem("merchantId", "' + merchant.id + '")');
    console.log('3. Refresh the page');
    
  } catch (error) {
    console.error('Error setting up fresh account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupFreshAccount(); 