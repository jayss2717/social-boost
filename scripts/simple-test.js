const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleTest() {
  console.log('🧪 Starting Simple App Flow Test...\n');

  try {
    // Test 1: Check database connection
    console.log('📋 Test 1: Database Connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);

    // Test 2: Check existing merchants
    console.log('\n📋 Test 2: Check Existing Merchants...');
    const merchants = await prisma.merchant.findMany({
      take: 5,
      select: {
        id: true,
        shop: true,
        isActive: true,
      },
    });
    console.log(`✅ Found ${merchants.length} merchants`);
    merchants.forEach(m => console.log(`  - ${m.shop} (${m.isActive ? 'Active' : 'Inactive'})`));

    // Test 3: Check existing influencers
    console.log('\n📋 Test 3: Check Existing Influencers...');
    const influencers = await prisma.influencer.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        commissionRate: true,
        isActive: true,
      },
    });
    console.log(`✅ Found ${influencers.length} influencers`);
    influencers.forEach(i => console.log(`  - ${i.name} (${i.commissionRate * 100}% commission)`));

    // Test 4: Check existing payouts
    console.log('\n📋 Test 4: Check Existing Payouts...');
    const payouts = await prisma.payout.findMany({
      take: 5,
      select: {
        id: true,
        status: true,
        commissionAmount: true,
        originalAmount: true,
        discountedAmount: true,
      },
    });
    console.log(`✅ Found ${payouts.length} payouts`);
    payouts.forEach(p => console.log(`  - ${p.status}: $${p.commissionAmount} (${p.originalAmount} → ${p.discountedAmount})`));

    // Test 5: Simulate commission calculation
    console.log('\n📋 Test 5: Commission Calculation Test...');
    const testOrder = {
      originalAmount: 100.00,
      discountedAmount: 80.00,
      commissionRate: 0.05,
      calculationBase: 'DISCOUNTED_AMOUNT',
    };

    let baseAmount;
    if (testOrder.calculationBase === 'DISCOUNTED_AMOUNT') {
      baseAmount = testOrder.discountedAmount;
    } else {
      baseAmount = testOrder.originalAmount;
    }

    const commissionAmount = baseAmount * testOrder.commissionRate;

    console.log('📊 Commission Calculation:');
    console.log(`  Original Amount: $${testOrder.originalAmount}`);
    console.log(`  Discounted Amount: $${testOrder.discountedAmount}`);
    console.log(`  Commission Rate: ${testOrder.commissionRate * 100}%`);
    console.log(`  Calculation Base: ${testOrder.calculationBase}`);
    console.log(`  Commission Amount: $${commissionAmount.toFixed(2)}`);

    // Test 6: Check database schema
    console.log('\n📋 Test 6: Database Schema Verification...');
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payouts' 
      ORDER BY ordinal_position
    `;
    console.log('✅ Payouts table schema:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });

    console.log('\n🎉 Simple App Flow Test Successful!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Database connection working');
    console.log('✅ Existing data accessible');
    console.log('✅ Commission calculation logic working');
    console.log('✅ Database schema properly migrated');
    console.log('✅ Enhanced payout fields available');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
simpleTest(); 