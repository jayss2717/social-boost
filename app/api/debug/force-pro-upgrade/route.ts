import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🔧 Force upgrading subscription to Pro for ${shop}`);

    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Pro plan not found' }, { status: 500 });
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
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    const result = {
      success: true,
      message: 'Subscription successfully updated to Pro plan',
      subscription: {
        shop: updatedMerchant?.shop,
        plan: updatedMerchant?.subscription?.plan?.name,
        status: updatedMerchant?.subscription?.status,
        limits: {
          ugcLimit: updatedMerchant?.subscription?.plan?.ugcLimit,
          influencerLimit: updatedMerchant?.subscription?.plan?.influencerLimit,
        },
      },
    };

    console.log('📋 Updated subscription:', result.subscription);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
} 