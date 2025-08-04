import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        priceCents: 2900, // $29/month
        ugcLimit: 20,
        influencerLimit: 5,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        priceCents: 2999, // $29.99/month
        ugcLimit: 300,
        influencerLimit: 10,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Scale' },
      update: {},
      create: {
        name: 'Scale',
        priceCents: 6999, // $69.99/month
        ugcLimit: 1000,
        influencerLimit: 50,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Professional' },
      update: {},
      create: {
        name: 'Professional',
        priceCents: 7900, // $79/month
        ugcLimit: 100,
        influencerLimit: 20,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        priceCents: 19900, // $199/month
        ugcLimit: -1, // Unlimited
        influencerLimit: -1, // Unlimited
      },
    }),
  ]);

  console.log('✅ Plans created:', plans.map(p => p.name));

  // Create test merchant
  const merchant = await prisma.merchant.upsert({
    where: { shop: 'teststorev101.myshopify.com' },
    update: {},
    create: {
      shop: 'teststorev101.myshopify.com',
      accessToken: 'pending',
      scope: 'read_products,write_products',
      shopName: 'Test Store v101',
      shopEmail: 'test@storev101.com',
      shopDomain: 'teststorev101.myshopify.com',
      shopCurrency: 'USD',
      shopTimezone: 'America/New_York',
      shopLocale: 'en',
      onboardingCompleted: true,
      onboardingStep: 5,
      onboardingData: {
        businessType: 'ECOMMERCE',
        industry: 'Fashion',
        goals: ['Increase brand awareness', 'Drive sales'],
        commissionRate: 10,
        autoApprove: false,
        minEngagement: 100,
        payoutSchedule: 'WEEKLY',
        teamSize: '1-5',
      },
    },
  });

  console.log('✅ Test merchant created:', merchant.shop);

  // Create subscription for the merchant
  const subscription = await prisma.subscription.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      planId: plans[0].id, // Starter plan
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('✅ Subscription created for merchant');

  // Create merchant settings
  const settings = await prisma.merchantSettings.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      name: 'Test Store',
      email: 'test@storev101.com',
      website: 'https://teststorev101.myshopify.com',
      linkPattern: '/discount/{code}',
      socialMedia: {
        instagram: '@teststore',
        tiktok: '@teststore',
        twitter: '@teststore',
        youtube: '@teststore',
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
        hashtags: ['#teststore', '#sponsored'],
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

  console.log('✅ Merchant settings created');

  // Create some test influencers
  const influencers = await Promise.all([
    prisma.influencer.create({
      data: {
        merchantId: merchant.id,
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        instagramHandle: '@sarahwilson',
        tiktokHandle: '@sarahwilson',
        commissionRate: 12,
        isActive: true,
      },
    }),
    prisma.influencer.create({
      data: {
        merchantId: merchant.id,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        instagramHandle: '@mikejohnson',
        tiktokHandle: '@mikejohnson',
        commissionRate: 10,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Test influencers created:', influencers.length);

  // Create some test UGC posts
  const ugcPosts = await Promise.all([
    prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        platform: 'INSTAGRAM',
        postUrl: 'https://instagram.com/p/test1',
        postId: 'test_post_1',
        content: 'Amazing product! Love the quality and design. Highly recommend! #teststore #sponsored',
        mediaUrls: ['https://example.com/image1.jpg'],
        engagement: 1250,
        isApproved: true,
        isRewarded: true,
        rewardAmount: 2500, // $25
      },
    }),
    prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[1].id,
        platform: 'TIKTOK',
        postUrl: 'https://tiktok.com/@mikejohnson/video/test2',
        postId: 'test_post_2',
        content: 'Just tried this amazing product! The quality is incredible. #teststore #sponsored',
        mediaUrls: ['https://example.com/video1.mp4'],
        engagement: 850,
        isApproved: true,
        isRewarded: true,
        rewardAmount: 2000, // $20
      },
    }),
    prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        platform: 'INSTAGRAM',
        postUrl: 'https://instagram.com/p/test3',
        postId: 'test_post_3',
        content: 'Another great product from this brand! #teststore #sponsored',
        mediaUrls: ['https://example.com/image2.jpg'],
        engagement: 650,
        isApproved: false,
        isRewarded: false,
      },
    }),
  ]);

  console.log('✅ Test UGC posts created:', ugcPosts.length);

  // Create some test payouts
  const payouts = await Promise.all([
    prisma.payout.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        amount: 4500, // $45
        status: 'COMPLETED',
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        periodEnd: new Date(),
      },
    }),
    prisma.payout.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[1].id,
        amount: 2000, // $20
        status: 'PENDING',
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        periodEnd: new Date(),
      },
    }),
  ]);

  console.log('✅ Test payouts created:', payouts.length);

  // Create some test discount codes
  const discountCodes = await Promise.all([
    prisma.discountCode.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        ugcPostId: ugcPosts[0].id,
        code: 'SARAH15',
        uniqueLink: 'https://teststorev101.myshopify.com/discount/SARAH15',
        codeType: 'INFLUENCER',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        usageLimit: 100,
        usageCount: 25,
        isActive: true,
      },
    }),
    prisma.discountCode.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[1].id,
        ugcPostId: ugcPosts[1].id,
        code: 'MIKE10',
        uniqueLink: 'https://teststorev101.myshopify.com/discount/MIKE10',
        codeType: 'INFLUENCER',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        usageLimit: 50,
        usageCount: 15,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Test discount codes created:', discountCodes.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 