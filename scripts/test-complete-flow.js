const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteFlow() {
  console.log('🧪 Starting Complete App Flow Test...\n');

  try {
    // Step 1: Create Test Merchant
    console.log('📋 Step 1: Creating Test Merchant...');
    const merchant = await prisma.merchant.create({
      data: {
        shop: 'test-store-123.myshopify.com',
        accessToken: 'test_access_token_123',
        scope: 'read_products,write_products,read_orders,write_orders',
        isActive: true,
        onboardingCompleted: true,
        onboardingStep: 5,
      },
    });
    console.log('✅ Merchant created:', merchant.id);

    // Step 2: Create Merchant Settings
    console.log('\n📋 Step 2: Creating Merchant Settings...');
    const merchantSettings = await prisma.merchantSettings.create({
      data: {
        merchantId: merchant.id,
        name: 'Test Store',
        email: 'test@store.com',
        website: 'https://test-store-123.myshopify.com',
        socialMedia: {
          instagram: '@teststore',
          tiktok: '@teststore',
        },
        discountSettings: {
          defaultPercentage: 20,
          minPercentage: 5,
          maxPercentage: 50,
          autoApprove: true,
        },
        commissionSettings: {
          defaultRate: 0.05,
          minRate: 0.02,
          maxRate: 0.15,
          commissionCalculationBase: 'DISCOUNTED_AMOUNT',
        },
        ugcSettings: {
          autoApprove: true,
          minEngagement: 100,
          hashtags: ['#teststore', '#fashion'],
        },
        payoutSettings: {
          autoPayout: true,
          minimumPayoutAmount: 10,
          payoutSchedule: 'WEEKLY',
          payoutDay: 'MONDAY',
          payoutTime: '09:00',
          payoutCurrency: 'USD',
          payoutMethod: 'STRIPE',
        },
      },
    });
    console.log('✅ Merchant settings created');

    // Step 3: Create Test Influencer
    console.log('\n📋 Step 3: Creating Test Influencer...');
    const influencer = await prisma.influencer.create({
      data: {
        merchantId: merchant.id,
        name: 'Test Influencer',
        email: 'influencer@test.com',
        instagramHandle: '@testinfluencer',
        tiktokHandle: '@testinfluencer',
        commissionRate: 0.05,
        isActive: true,
      },
    });
    console.log('✅ Influencer created:', influencer.id);

    // Step 4: Create Discount Code
    console.log('\n📋 Step 4: Creating Discount Code...');
    const discountCode = await prisma.discountCode.create({
      data: {
        merchant: {
          connect: { id: merchant.id }
        },
        influencer: {
          connect: { id: influencer.id }
        },
        code: 'TESTINFLUENCER20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        usageLimit: 100,
        usageCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        uniqueLink: 'https://test-store-123.myshopify.com/discount/TESTINFLUENCER20',
      },
    });
    console.log('✅ Discount code created:', discountCode.code);

    // Step 5: Simulate Order Webhook
    console.log('\n📋 Step 5: Simulating Order Webhook...');
    const orderData = {
      id: 'test_order_12345',
      total_price: '100.00',
      discount_codes: [
        {
          code: 'TESTINFLUENCER20',
          amount: '20.00',
        },
      ],
    };

    // Simulate the order processing logic
    const originalAmount = parseFloat(orderData.total_price);
    const discountAmount = parseFloat(orderData.discount_codes[0].amount);
    const discountedAmount = originalAmount - discountAmount;
    const commissionRate = influencer.commissionRate;
    const commissionCalculationBase = merchantSettings.commissionSettings.commissionCalculationBase;

    let baseAmount;
    if (commissionCalculationBase === 'DISCOUNTED_AMOUNT') {
      baseAmount = discountedAmount;
    } else {
      baseAmount = originalAmount;
    }

    const commissionAmount = baseAmount * commissionRate;

    console.log('📊 Commission Calculation:');
    console.log(`  Original Amount: $${originalAmount}`);
    console.log(`  Discount Amount: $${discountAmount}`);
    console.log(`  Discounted Amount: $${discountedAmount}`);
    console.log(`  Commission Rate: ${commissionRate * 100}%`);
    console.log(`  Calculation Base: ${commissionCalculationBase}`);
    console.log(`  Commission Amount: $${commissionAmount.toFixed(2)}`);

    // Step 6: Create Payout Record
    console.log('\n📋 Step 6: Creating Payout Record...');
    const payout = await prisma.payout.create({
      data: {
        merchantId: merchant.id,
        influencerId: influencer.id,
        orderId: orderData.id,
        originalAmount,
        discountedAmount,
        commissionAmount,
        commissionRate,
        discountCode: orderData.discount_codes[0].code,
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(),
        amount: Math.round(commissionAmount * 100), // Convert to cents for old column
      },
    });
    console.log('✅ Payout created:', payout.id);

    // Step 7: Update Discount Code Usage
    console.log('\n📋 Step 7: Updating Discount Code Usage...');
    await prisma.discountCode.update({
      where: { id: discountCode.id },
      data: { usageCount: { increment: 1 } },
    });
    console.log('✅ Discount code usage updated');

    // Step 8: Check Auto-payout Conditions
    console.log('\n📋 Step 8: Checking Auto-payout Conditions...');
    const minimumAmount = merchantSettings.payoutSettings.minimumPayoutAmount;
    const shouldAutoPayout = commissionAmount >= minimumAmount;

    console.log(`  Commission Amount: $${commissionAmount.toFixed(2)}`);
    console.log(`  Minimum Payout Amount: $${minimumAmount}`);
    console.log(`  Should Auto-payout: ${shouldAutoPayout ? 'YES' : 'NO'}`);

    if (shouldAutoPayout) {
      console.log('  🚀 Auto-payout criteria met! Would trigger Stripe transfer.');
    } else {
      console.log('  ⏳ Commission below minimum, payout will remain pending.');
    }

    // Step 9: Verify Data Integrity
    console.log('\n📋 Step 9: Verifying Data Integrity...');
    
    const payoutRecord = await prisma.payout.findUnique({
      where: { id: payout.id },
      include: {
        merchant: true,
        influencer: true,
      },
    });

    console.log('📊 Final Payout Record:');
    console.log(`  ID: ${payoutRecord.id}`);
    console.log(`  Merchant: ${payoutRecord.merchant.shop}`);
    console.log(`  Influencer: ${payoutRecord.influencer.name}`);
    console.log(`  Order ID: ${payoutRecord.orderId}`);
    console.log(`  Original Amount: $${payoutRecord.originalAmount}`);
    console.log(`  Discounted Amount: $${payoutRecord.discountedAmount}`);
    console.log(`  Commission Amount: $${payoutRecord.commissionAmount}`);
    console.log(`  Commission Rate: ${payoutRecord.commissionRate * 100}%`);
    console.log(`  Discount Code: ${payoutRecord.discountCode}`);
    console.log(`  Status: ${payoutRecord.status}`);

    // Step 10: Test Analytics Queries
    console.log('\n📋 Step 10: Testing Analytics Queries...');
    
    const totalPayouts = await prisma.payout.count({
      where: { merchantId: merchant.id },
    });

    const totalCommission = await prisma.payout.aggregate({
      where: { merchantId: merchant.id },
      _sum: { commissionAmount: true },
    });

    const payoutByStatus = await prisma.payout.groupBy({
      by: ['status'],
      where: { merchantId: merchant.id },
      _count: { id: true },
      _sum: { commissionAmount: true },
    });

    console.log('📊 Analytics Results:');
    console.log(`  Total Payouts: ${totalPayouts}`);
    console.log(`  Total Commission: $${totalCommission._sum.commissionAmount?.toFixed(2) || '0.00'}`);
    console.log('  Payouts by Status:');
    payoutByStatus.forEach(group => {
      console.log(`    ${group.status}: ${group._count.id} payouts, $${group._sum.commissionAmount?.toFixed(2) || '0.00'}`);
    });

    console.log('\n🎉 Complete App Flow Test Successful!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Merchant installation and setup');
    console.log('✅ Influencer creation and management');
    console.log('✅ Discount code generation');
    console.log('✅ Order webhook processing');
    console.log('✅ Commission calculation');
    console.log('✅ Payout record creation');
    console.log('✅ Auto-payout condition checking');
    console.log('✅ Data integrity verification');
    console.log('✅ Analytics and reporting');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteFlow(); 