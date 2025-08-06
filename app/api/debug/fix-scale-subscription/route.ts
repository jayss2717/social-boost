import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔧 Fixing subscription for shop:', shop);

    // Find merchant by shop
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
      id: merchant.subscription?.id,
      status: merchant.subscription?.status,
      plan: merchant.subscription?.plan.name,
      stripeSubId: merchant.subscription?.stripeSubId,
    });

    // Get the Scale plan
    const scalePlan = await prisma.plan.findUnique({
      where: { name: 'Scale' },
    });

    if (!scalePlan) {
      return NextResponse.json({ error: 'Scale plan not found in database' }, { status: 404 });
    }

    console.log('📋 Scale plan found:', {
      id: scalePlan.id,
      name: scalePlan.name,
      ugcLimit: scalePlan.ugcLimit,
      influencerLimit: scalePlan.influencerLimit,
    });

    // Update or create subscription
    let updatedSubscription;
    if (merchant.subscription) {
      updatedSubscription = await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: {
          planId: scalePlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: {
          plan: true,
        },
      });
    } else {
      updatedSubscription = await prisma.subscription.create({
        data: {
          merchantId: merchant.id,
          planId: scalePlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: {
          plan: true,
        },
      });
    }

    console.log('✅ Updated subscription:', {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      plan: updatedSubscription.plan.name,
      ugcLimit: updatedSubscription.plan.ugcLimit,
      influencerLimit: updatedSubscription.plan.influencerLimit,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription updated to Scale plan',
      oldPlan: merchant.subscription?.plan.name || 'None',
      newPlan: updatedSubscription.plan.name,
      newLimits: {
        ugcLimit: updatedSubscription.plan.ugcLimit,
        influencerLimit: updatedSubscription.plan.influencerLimit,
      },
    });

  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
    return NextResponse.json({ error: 'Failed to fix subscription' }, { status: 500 });
  }
} 