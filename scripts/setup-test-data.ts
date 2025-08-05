import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('Setting up test data...');
  
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

    // Create a test merchant
    const merchant = await prisma.merchant.create({
      data: {
        shop: 'test-shop.myshopify.com',
        accessToken: 'test-access-token',
        scope: 'read_products,write_products',
        shopName: 'Test Shop',
        shopEmail: 'test@example.com',
        shopDomain: 'test-shop.myshopify.com',
        shopCurrency: 'USD',
        shopTimezone: 'America/New_York',
        shopLocale: 'en',
        onboardingCompleted: true,
        onboardingStep: 3,
      },
    });

    console.log('Created test merchant:', merchant.id);

    // Create merchant settings
    const merchantSettings = await prisma.merchantSettings.create({
      data: {
        merchantId: merchant.id,
        name: 'Test Merchant',
        email: 'test@example.com',
        website: 'https://test-shop.myshopify.com',
        linkPattern: '/discount/{code}',
        socialMedia: {
          instagram: '@testshop',
          tiktok: '@testshop',
          twitter: '@testshop',
          youtube: '@testshop',
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
          hashtags: ['#testshop', '#sponsored'],
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
        stripeSubId: 'sub_test123',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    console.log('Created subscription:', subscription.id);

    console.log('\n=== Test Data Setup Complete ===');
    console.log('Merchant ID:', merchant.id);
    console.log('Shop:', merchant.shop);
    console.log('Plan:', starterPlan.name);
    console.log('\nTo use this in your app:');
    console.log('1. Open browser console');
    console.log('2. Run: localStorage.setItem("merchantId", "' + merchant.id + '")');
    console.log('3. Refresh the page');
    
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData(); 