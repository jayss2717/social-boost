import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixScaleSubscription() {
  try {
    console.log('🔧 Fixing subscription to Scale plan...');

    // Find the merchant by shop
    const merchant = await prisma.merchant.findUnique({
      where: { shop: 'teststorev102.myshopify.com' },
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

    console.log('📊 Current subscription:', {
      merchantId: merchant.id,
      shop: merchant.shop,
      currentPlan: merchant.subscription?.plan?.name,
      status: merchant.subscription?.status,
    });

    // Find the Scale plan
    const scalePlan = await prisma.plan.findUnique({
      where: { name: 'Scale' },
    });

    if (!scalePlan) {
      console.error('❌ Scale plan not found');
      return;
    }

    console.log('📋 Scale plan found:', {
      id: scalePlan.id,
      name: scalePlan.name,
      priceCents: scalePlan.priceCents,
      ugcLimit: scalePlan.ugcLimit,
      influencerLimit: scalePlan.influencerLimit,
    });

    // Update the subscription to link to the Scale plan
    const updatedSubscription = await prisma.subscription.update({
      where: { merchantId: merchant.id },
      data: {
        planId: scalePlan.id,
      },
      include: {
        plan: true,
      },
    });

    console.log('✅ Subscription updated successfully!');
    console.log('📊 Updated subscription:', {
      id: updatedSubscription.id,
      planName: updatedSubscription.plan.name,
      planId: updatedSubscription.planId,
      status: updatedSubscription.status,
    });

    // Verify the limits
    const usage = await prisma.$transaction([
      prisma.ugcPost.count({ where: { merchantId: merchant.id } }),
      prisma.influencer.count({ where: { merchantId: merchant.id } }),
    ]);

    console.log('📈 Current usage:', {
      ugcCount: usage[0],
      influencerCount: usage[1],
      ugcLimit: scalePlan.ugcLimit,
      influencerLimit: scalePlan.influencerLimit,
    });

  } catch (error) {
    console.error('❌ Failed to fix subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixScaleSubscription(); 