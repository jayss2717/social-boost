import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Starting comprehensive database cleanup...');

    // Clear all data in the correct order to respect foreign key constraints
    console.log('🗑️  Clearing payouts...');
    await prisma.payout.deleteMany({});

    console.log('🗑️  Clearing discount codes...');
    await prisma.discountCode.deleteMany({});

    console.log('🗑️  Clearing UGC posts...');
    await prisma.ugcPost.deleteMany({});

    console.log('🗑️  Clearing influencers...');
    await prisma.influencer.deleteMany({});

    console.log('🗑️  Clearing subscriptions...');
    await prisma.subscription.deleteMany({});

    console.log('🗑️  Clearing merchant settings...');
    await prisma.merchantSettings.deleteMany({});

    console.log('🗑️  Clearing social media accounts...');
    await prisma.socialMediaAccount.deleteMany({});

    console.log('🗑️  Clearing brand mentions...');
    await prisma.brandMention.deleteMany({});

    console.log('🗑️  Clearing order metrics...');
    await prisma.orderMetric.deleteMany({});

    console.log('🗑️  Clearing UGC rejections...');
    await prisma.ugcRejection.deleteMany({});

    console.log('🗑️  Clearing UGC workflow rules...');
    await prisma.ugcWorkflowRules.deleteMany({});

    console.log('🗑️  Clearing commission performance...');
    await prisma.commissionPerformance.deleteMany({});

    console.log('🗑️  Clearing commission insights...');
    await prisma.commissionInsights.deleteMany({});

    console.log('🗑️  Clearing UGC content analysis...');
    await prisma.ugcContentAnalysis.deleteMany({});

    console.log('🗑️  Clearing UGC workflow history...');
    await prisma.ugcWorkflowHistory.deleteMany({});

    console.log('🗑️  Clearing merchants...');
    await prisma.merchant.deleteMany({});

    console.log('🗑️  Clearing plans...');
    await prisma.plan.deleteMany({});

    console.log('✅ Database cleanup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - All merchants removed');
    console.log('   - All influencers removed');
    console.log('   - All UGC posts removed');
    console.log('   - All discount codes removed');
    console.log('   - All payouts removed');
    console.log('   - All subscriptions removed');
    console.log('   - All settings removed');
    console.log('   - All plans removed');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Run: npm run db:seed (to create plans)');
    console.log('   2. Install the app on a fresh Shopify store');
    console.log('   3. Test the complete flow from installation');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase(); 