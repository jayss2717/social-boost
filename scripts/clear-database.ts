import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Starting database cleanup...');
  
  try {
    // Clear in order of dependencies (child tables first)
    console.log('Clearing workflow history...');
    await prisma.ugcWorkflowHistory.deleteMany();
    
    console.log('Clearing content analysis...');
    await prisma.ugcContentAnalysis.deleteMany();
    
    console.log('Clearing commission insights...');
    await prisma.commissionInsights.deleteMany();
    
    console.log('Clearing commission performance...');
    await prisma.commissionPerformance.deleteMany();
    
    console.log('Clearing UGC rejections...');
    await prisma.ugcRejection.deleteMany();
    
    console.log('Clearing order metrics...');
    await prisma.orderMetric.deleteMany();
    
    console.log('Clearing brand mentions...');
    await prisma.brandMention.deleteMany();
    
    console.log('Clearing social media accounts...');
    await prisma.socialMediaAccount.deleteMany();
    
    console.log('Clearing payouts...');
    await prisma.payout.deleteMany();
    
    console.log('Clearing discount codes...');
    await prisma.discountCode.deleteMany();
    
    console.log('Clearing UGC posts...');
    await prisma.ugcPost.deleteMany();
    
    console.log('Clearing influencers...');
    await prisma.influencer.deleteMany();
    
    console.log('Clearing merchant settings...');
    await prisma.merchantSettings.deleteMany();
    
    console.log('Clearing subscriptions...');
    await prisma.subscription.deleteMany();
    
    console.log('Clearing merchants...');
    await prisma.merchant.deleteMany();
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase(); 