import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { merchantId },
      include: {
        plan: true,
      },
    });

    // Get usage statistics
    const influencerCount = await prisma.influencer.count({
      where: { merchantId, isActive: true },
    });

    const dmsSentThisMonth = await prisma.discountCode.count({
      where: {
        merchantId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // Get all available plans
    const plans = await prisma.plan.findMany({
      orderBy: { priceCents: 'asc' },
    });

    return NextResponse.json({
      success: true,
      subscription,
      usage: {
        influencers: influencerCount,
        dmsSent: dmsSentThisMonth,
        limit: subscription?.plan ? {
          influencers: subscription.plan.influencerLimit,
          dmsPerMonth: subscription.plan.ugcLimit,
        } : {
          influencers: 1,
          dmsPerMonth: 5,
        },
      },
      plans,
    });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
    }

    const { planId, billingCycle } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Get the plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate billing period
    const currentPeriodEnd = new Date();
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { merchantId },
      update: {
        planId,
        currentPeriodEnd,
        status: 'ACTIVE',
      },
      create: {
        merchantId,
        planId,
        currentPeriodEnd,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
} 