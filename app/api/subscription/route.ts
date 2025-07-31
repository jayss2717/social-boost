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

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

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
      subscription,
      usage: {
        influencerCount,
        ugcCount: dmsSentThisMonth,
        influencerLimit: subscription?.plan?.influencerLimit || 5,
        ugcLimit: subscription?.plan?.ugcLimit || 20,
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

    // Verify plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { merchantId },
      update: {
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      create: {
        merchantId,
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
} 