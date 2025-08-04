import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing subscription to Pro plan...');

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

  console.log('📋 Current subscription:', {
    shop: merchant.shop,
    plan: merchant.subscription?.plan?.name,
    status: merchant.subscription?.status,
  });

  // Get the Pro plan
  const proPlan = await prisma.plan.findUnique({
    where: { name: 'Pro' },
  });

  if (!proPlan) {
    console.error('❌ Pro plan not found');
    return;
  }

  // Update or create subscription
  if (merchant.subscription) {
    await prisma.subscription.update({
      where: { id: merchant.subscription.id },
      data: {
        planId: proPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    console.log('✅ Updated existing subscription to Pro plan');
  } else {
    await prisma.subscription.create({
      data: {
        merchantId: merchant.id,
        planId: proPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    console.log('✅ Created new Pro subscription');
  }

  // Verify the update
  const updatedMerchant = await prisma.merchant.findUnique({
    where: { shop: 'teststorev103.myshopify.com' },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  console.log('📋 Updated subscription:', {
    shop: updatedMerchant?.shop,
    plan: updatedMerchant?.subscription?.plan?.name,
    status: updatedMerchant?.subscription?.status,
    limits: {
      ugcLimit: updatedMerchant?.subscription?.plan?.ugcLimit,
      influencerLimit: updatedMerchant?.subscription?.plan?.influencerLimit,
    },
  });

  console.log('🎉 Subscription successfully updated to Pro plan!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 