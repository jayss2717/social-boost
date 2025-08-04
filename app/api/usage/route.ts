import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSubscriptionUsage } from '@/utils/subscription';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

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

    // Get usage data
    const usage = await getSubscriptionUsage(merchant.id);

    // Get current plan
    const currentPlan = merchant.subscription?.plan?.name || 'Starter';

    return NextResponse.json({
      success: true,
      usage: {
        ugcCount: usage.ugcCount,
        influencerCount: usage.influencerCount,
        ugcLimit: usage.ugcLimit,
        influencerLimit: usage.influencerLimit,
      },
      plan: {
        name: currentPlan,
        priceCents: merchant.subscription?.plan?.priceCents || 0,
      },
      subscription: merchant.subscription ? {
        id: merchant.subscription.id,
        status: merchant.subscription.status,
        currentPeriodEnd: merchant.subscription.currentPeriodEnd,
      } : null,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
} 