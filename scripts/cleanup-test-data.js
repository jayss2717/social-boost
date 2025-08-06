const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');

  try {
    // Delete test payouts
    const deletedPayouts = await prisma.payout.deleteMany({
      where: {
        OR: [
          { orderId: 'test_order_12345' },
          { discountCode: 'TESTINFLUENCER20' },
        ],
      },
    });
    console.log(`✅ Deleted ${deletedPayouts.count} test payouts`);

    // Delete test discount codes
    const deletedDiscountCodes = await prisma.discountCode.deleteMany({
      where: {
        code: 'TESTINFLUENCER20',
      },
    });
    console.log(`✅ Deleted ${deletedDiscountCodes.count} test discount codes`);

    // Delete test influencers
    const deletedInfluencers = await prisma.influencer.deleteMany({
      where: {
        email: 'influencer@test.com',
      },
    });
    console.log(`✅ Deleted ${deletedInfluencers.count} test influencers`);

    // Delete test merchant settings
    const deletedSettings = await prisma.merchantSettings.deleteMany({
      where: {
        email: 'test@store.com',
      },
    });
    console.log(`✅ Deleted ${deletedSettings.count} test merchant settings`);

    // Delete test merchants
    const deletedMerchants = await prisma.merchant.deleteMany({
      where: {
        shop: 'test-store-123.myshopify.com',
      },
    });
    console.log(`✅ Deleted ${deletedMerchants.count} test merchants`);

    console.log('\n🎉 Test data cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData(); 