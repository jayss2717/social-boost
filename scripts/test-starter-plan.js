const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStarterPlan() {
  console.log('🧪 Testing Starter plan validation...');

  try {
    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop: 'teststorev103.myshopify.com' },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      console.error('❌ Merchant not found');
      return;
    }

    console.log('📋 Current plan:', merchant.subscription?.plan?.name);

    // Get the Starter plan
    const starterPlan = await prisma.plan.findUnique({
      where: { name: 'Starter' },
    });

    if (!starterPlan) {
      console.error('❌ Starter plan not found');
      return;
    }

    // Temporarily downgrade to Starter for testing
    if (merchant.subscription) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: {
          planId: starterPlan.id,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Temporarily downgraded to Starter plan');
    }

    // Test usage limits manually
    const ugcCount = await prisma.ugcPost.count({ where: { merchantId: merchant.id } });
    const influencerCount = await prisma.influencer.count({ where: { merchantId: merchant.id } });

    console.log('📊 Usage data:', {
      ugcCount,
      influencerCount,
      ugcLimit: 5,
      influencerLimit: 1,
    });

    // Test limit checks
    const ugcAllowed = ugcCount < 5;
    const influencerAllowed = influencerCount < 1;

    console.log('🔍 Limit checks:');
    console.log('  UGC:', {
      current: ugcCount,
      limit: 5,
      allowed: ugcAllowed,
    });
    console.log('  Influencer:', {
      current: influencerCount,
      limit: 1,
      allowed: influencerAllowed,
    });

    // Test plan hierarchy
    const planHierarchy = { Starter: 0, Pro: 1, Scale: 2, Enterprise: 3 };
    const currentPlanLevel = planHierarchy['Starter'];
    
    console.log('📈 Plan hierarchy test:');
    console.log('  Can access Pro features:', currentPlanLevel >= planHierarchy['Pro']);
    console.log('  Can access Scale features:', currentPlanLevel >= planHierarchy['Scale']);
    console.log('  Can access Enterprise features:', currentPlanLevel >= planHierarchy['Enterprise']);

    // Test API endpoint validation
    console.log('🔗 API endpoint validation:');
    console.log('  UGC endpoint would check:', ugcAllowed ? 'ALLOWED' : 'BLOCKED');
    console.log('  Influencer endpoint would check:', influencerAllowed ? 'ALLOWED' : 'BLOCKED');

    console.log('✅ Starter plan validation test completed');

    // Restore to Pro plan
    const proPlan = await prisma.plan.findUnique({
      where: { name: 'Pro' },
    });

    if (proPlan) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: {
          planId: proPlan.id,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Restored to Pro plan');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStarterPlan(); 