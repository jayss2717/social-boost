import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Find the merchant and their subscription
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
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

    // Check if subscription is canceled and still within period
    if (merchant.subscription.status !== 'CANCELED') {
      return NextResponse.json({ error: 'Subscription is not canceled' }, { status: 400 });
    }

    const now = new Date();
    if (merchant.subscription.currentPeriodEnd <= now) {
      return NextResponse.json({ error: 'Subscription period has ended' }, { status: 400 });
    }

    // Reactivate in Stripe if subscription exists
    if (merchant.subscription.stripeSubId && stripe) {
      try {
        await stripe.subscriptions.update(merchant.subscription.stripeSubId, {
          cancel_at_period_end: false,
        });
      } catch (stripeError) {
        console.error('Stripe reactivation error:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update subscription status in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: merchant.subscription.id },
      data: {
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        plan: updatedSubscription.plan ? {
          id: updatedSubscription.plan.id,
          name: updatedSubscription.plan.name,
          priceCents: updatedSubscription.plan.priceCents,
        } : null,
      },
      message: 'Subscription has been reactivated successfully',
    });
  } catch (error) {
    console.error('Subscription reactivation error:', error);
    return NextResponse.json({ error: 'Failed to reactivate subscription' }, { status: 500 });
  }
} 