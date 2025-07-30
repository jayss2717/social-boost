import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: 'Free' },
      update: {},
      create: {
        name: 'Free',
        priceCents: 0,
        ugcLimit: 20,
        influencerLimit: 5,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        priceCents: 2900,
        ugcLimit: 1000,
        influencerLimit: -1, // Unlimited
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Scale' },
      update: {},
      create: {
        name: 'Scale',
        priceCents: 9900,
        ugcLimit: -1, // Unlimited
        influencerLimit: -1, // Unlimited
      },
    }),
  ]);

  console.log('✅ Plans created:', plans.map(p => p.name));

  // Create demo merchant
  const merchant = await prisma.merchant.upsert({
    where: { shop: 'demo-store.myshopify.com' },
    update: {},
    create: {
      shop: 'demo-store.myshopify.com',
      accessToken: 'demo_access_token',
      scope: 'read_orders,write_discounts,read_products,read_customers',
      isActive: true,
    },
  });

  console.log('✅ Demo merchant created:', merchant.shop);

  // Create subscription for demo merchant
  const subscription = await prisma.subscription.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      planId: plans[0].id, // Free plan
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log('✅ Subscription created for demo merchant');

  // Create demo influencers
  const influencers = await Promise.all([
    prisma.influencer.create({
      data: {
        merchantId: merchant.id,
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        instagramHandle: 'sarahjohnson',
        tiktokHandle: 'sarahjohnson',
        commissionRate: 0.15,
        isActive: true,
      },
    }),
    prisma.influencer.create({
      data: {
        merchantId: merchant.id,
        name: 'Mike Chen',
        email: 'mike@example.com',
        instagramHandle: 'mikechen',
        tiktokHandle: 'mikechen',
        commissionRate: 0.10,
        isActive: true,
      },
    }),
    prisma.influencer.create({
      data: {
        merchantId: merchant.id,
        name: 'Emma Davis',
        email: 'emma@example.com',
        instagramHandle: 'emmadavis',
        tiktokHandle: 'emmadavis',
        commissionRate: 0.20,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Demo influencers created:', influencers.map(i => i.name));

  // Create demo UGC posts
  const ugcPosts = await Promise.all([
    prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        platform: 'INSTAGRAM',
        postUrl: 'https://instagram.com/p/ABC123',
        postId: 'ABC123',
        content: 'Just got my new product from @demostore! Love the quality and fast shipping! #demostore #shoplocal #quality',
        mediaUrls: ['https://example.com/image1.jpg'],
        engagement: 1250,
        isApproved: false,
        isRewarded: false,
      },
    }),
    prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[1].id,
        platform: 'TIKTOK',
        postUrl: 'https://tiktok.com/@mikechen/video/XYZ789',
        postId: 'XYZ789',
        content: 'Unboxing my latest purchase from @demostore! The packaging is amazing! #demostore #unboxing #tiktok',
        mediaUrls: ['https://example.com/video1.mp4'],
        engagement: 3200,
        isApproved: true,
        isRewarded: true,
      },
    }),
    prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[2].id,
        platform: 'INSTAGRAM',
        postUrl: 'https://instagram.com/p/DEF456',
        postId: 'DEF456',
        content: 'Styling session with my favorite pieces from @demostore! Perfect for any occasion! #demostore #fashion #style',
        mediaUrls: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
        engagement: 890,
        isApproved: true,
        isRewarded: false,
      },
    }),
  ]);

  console.log('✅ Demo UGC posts created:', ugcPosts.length);

  // Create demo discount codes
  const discountCodes = await Promise.all([
    prisma.discountCode.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        code: 'SARAH20',
        uniqueLink: 'https://demostore.com/discount/SARAH20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        usageLimit: 100,
        usageCount: 45,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    }),
    prisma.discountCode.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[1].id,
        code: 'MIKE15',
        uniqueLink: 'https://demostore.com/discount/MIKE15',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        usageLimit: 50,
        usageCount: 23,
        isActive: true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    }),
  ]);

  console.log('✅ Demo discount codes created:', discountCodes.map(d => d.code));

  // Create demo payouts
  const payouts = await Promise.all([
    prisma.payout.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[0].id,
        amount: 15000, // $150.00 in cents
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(),
        stripeTransferId: null,
      },
    }),
    prisma.payout.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[1].id,
        amount: 7550, // $75.50 in cents
        status: 'COMPLETED',
        periodStart: new Date(),
        periodEnd: new Date(),
        stripeTransferId: 'tr_demo_123456',
      },
    }),
    prisma.payout.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencers[2].id,
        amount: 20000, // $200.00 in cents
        status: 'PROCESSING',
        periodStart: new Date(),
        periodEnd: new Date(),
        stripeTransferId: null,
      },
    }),
  ]);

  console.log('✅ Demo payouts created:', payouts.length);

  // Create demo settings
  const settings = await prisma.merchantSettings.upsert({
    where: { merchantId: merchant.id },
    update: {},
    create: {
      merchantId: merchant.id,
      name: 'Demo Store',
      email: 'demo@store.com',
      socialMedia: {
        instagram: '@demostore',
        tiktok: '@demostore',
        twitter: '@demostore',
        youtube: 'demostore',
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
        requiredHashtags: ['#demostore', '#shoplocal'],
        excludedWords: ['spam', 'inappropriate'],
      },
      payoutSettings: {
        autoPayout: false,
        payoutSchedule: 'WEEKLY',
        minimumPayout: 50,
      },
    },
  });

  console.log('✅ Demo settings created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\nDemo Data Summary:');
  console.log(`- Plans: ${plans.length}`);
  console.log(`- Merchant: ${merchant.shop}`);
  console.log(`- Influencers: ${influencers.length}`);
  console.log(`- UGC Posts: ${ugcPosts.length}`);
  console.log(`- Discount Codes: ${discountCodes.length}`);
  console.log(`- Payouts: ${payouts.length}`);
  console.log(`- Settings: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 