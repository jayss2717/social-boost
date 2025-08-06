import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔧 Fixing plan for shop:', shop);

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

    if (!merchant.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    console.log('📋 Current plan:', merchant.subscription.plan.name);

    // Get the Pro plan
    const proPlan = await prisma.plan.findUnique({
      where: { name: 'Pro' },
    });

    if (!proPlan) {
      return NextResponse.json({ error: 'Pro plan not found in database' }, { status: 404 });
    }

    console.log('📋 Pro plan found:', proPlan.name, 'Limits:', proPlan.ugcLimit, '/', proPlan.influencerLimit);

    // Update subscription to Pro plan
    const updatedSubscription = await prisma.subscription.update({
      where: { id: merchant.subscription.id },
      data: {
        planId: proPlan.id,
      },
      include: {
        plan: true,
      },
    });

    console.log('✅ Updated subscription to Pro plan:', updatedSubscription.plan.name);

    return NextResponse.json({
      success: true,
      message: 'Subscription updated to Pro plan',
      oldPlan: merchant.subscription.plan.name,
      newPlan: updatedSubscription.plan.name,
      newLimits: {
        ugcLimit: updatedSubscription.plan.ugcLimit,
        influencerLimit: updatedSubscription.plan.influencerLimit,
      },
    });

  } catch (error) {
    console.error('❌ Error fixing plan:', error);
    return NextResponse.json({ error: 'Failed to fix plan' }, { status: 500 });
  }
} 