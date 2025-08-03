import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    // Find the merchant and their subscription
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
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'No subscription found',
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: merchant.subscription.id,
        status: merchant.subscription.status,
        currentPeriodEnd: merchant.subscription.currentPeriodEnd,
        createdAt: merchant.subscription.createdAt,
        plan: merchant.subscription.plan ? {
          id: merchant.subscription.plan.id,
          name: merchant.subscription.plan.name,
          priceCents: merchant.subscription.plan.priceCents,
          ugcLimit: merchant.subscription.plan.ugcLimit,
          influencerLimit: merchant.subscription.plan.influencerLimit,
        } : null,
      },
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const body = await request.json();
    const { planId, status = 'ACTIVE' } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { merchantId: merchant.id },
      update: {
        planId,
        status,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      create: {
        merchantId: merchant.id,
        planId,
        status,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
        plan: subscription.plan ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          priceCents: subscription.plan.priceCents,
          ugcLimit: subscription.plan.ugcLimit,
          influencerLimit: subscription.plan.influencerLimit,
        } : null,
      },
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
} 