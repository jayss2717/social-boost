import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, cancelAtPeriodEnd = true } = body;

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
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // If subscription has a Stripe subscription ID, cancel it in Stripe
    if (merchant.subscription.stripeSubId && stripe) {
      try {
        if (cancelAtPeriodEnd) {
          // Cancel at period end
          await stripe.subscriptions.update(merchant.subscription.stripeSubId, {
            cancel_at_period_end: true,
          });
        } else {
          // Cancel immediately
          await stripe.subscriptions.cancel(merchant.subscription.stripeSubId);
        }
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update subscription status in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: merchant.subscription.id },
      data: {
        status: cancelAtPeriodEnd ? 'CANCELING' : 'CANCELED',
        canceledAt: new Date(),
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
        canceledAt: updatedSubscription.canceledAt,
        plan: updatedSubscription.plan ? {
          id: updatedSubscription.plan.id,
          name: updatedSubscription.plan.name,
          priceCents: updatedSubscription.plan.priceCents,
        } : null,
      },
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the current period'
        : 'Subscription has been canceled immediately',
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
} 