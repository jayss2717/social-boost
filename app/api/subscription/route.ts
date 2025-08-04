import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSubscriptionUsage } from '@/utils/subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const merchantId = searchParams.get('merchantId');

    if (!shop && !merchantId) {
      return NextResponse.json({ error: 'Either shop or merchantId parameter is required' }, { status: 400 });
    }

    let merchant;

    if (shop) {
      // Find merchant by shop
      merchant = await prisma.merchant.findUnique({
        where: { shop },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });
    } else if (merchantId) {
      // Find merchant by ID
      merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });
    }

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get usage data
    const usage = await getSubscriptionUsage(merchant.id);

    if (!merchant.subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        usage: {
          ugcCount: usage.ugcCount,
          influencerCount: usage.influencerCount,
          ugcLimit: usage.ugcLimit,
          influencerLimit: usage.influencerLimit,
        },
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
      usage: {
        ugcCount: usage.ugcCount,
        influencerCount: usage.influencerCount,
        ugcLimit: usage.ugcLimit,
        influencerLimit: usage.influencerLimit,
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
    const merchantId = searchParams.get('merchantId');
    const body = await request.json();
    const { planId, status = 'ACTIVE' } = body;

    if (!shop && !merchantId) {
      return NextResponse.json({ error: 'Either shop or merchantId parameter is required' }, { status: 400 });
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Find the merchant
    let merchant;
    if (shop) {
      merchant = await prisma.merchant.findUnique({
        where: { shop },
      });
    } else {
      merchant = await prisma.merchant.findUnique({
        where: { id: merchantId! },
      });
    }

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