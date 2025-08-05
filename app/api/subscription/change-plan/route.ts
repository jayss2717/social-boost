import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, newPlan } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    if (!newPlan) {
      return NextResponse.json({ error: 'New plan is required' }, { status: 400 });
    }

    // Find the merchant
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

    // Get plan prices
    const planPrices = {
      STARTER: null, // Free plan
      PRO: process.env.STRIPE_PRO_PRICE_ID,
      SCALE: process.env.STRIPE_SCALE_PRICE_ID,
      ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    const newPlanPriceId = planPrices[newPlan as keyof typeof planPrices];
    
    if (!newPlanPriceId && newPlan !== 'STARTER') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // If upgrading to a paid plan, create Stripe checkout session
    if (newPlan !== 'STARTER' && newPlanPriceId && stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: newPlanPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.HOST}/billing?success=true&shop=${merchant.shop}`,
        cancel_url: `${process.env.HOST}/billing?cancel=true&shop=${merchant.shop}`,
        metadata: {
          merchantId: merchant.id,
          plan: newPlan,
          action: 'plan_change',
        },
      });

      return NextResponse.json({
        success: true,
        url: session.url,
        message: 'Redirecting to payment...',
      });
    }

    // If downgrading to free plan, update immediately
    if (newPlan === 'STARTER') {
      // Find the Starter plan (note: database uses "STARTER")
      const starterPlan = await prisma.plan.findFirst({
        where: { name: 'STARTER' },
      });

      if (!starterPlan) {
        return NextResponse.json({ error: 'Starter plan not found' }, { status: 500 });
      }

      // Update subscription to free plan
      const updatedSubscription = await prisma.subscription.upsert({
        where: { merchantId: merchant.id },
        update: {
          planId: starterPlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        create: {
          merchantId: merchant.id,
          planId: starterPlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
        message: 'Plan changed to Starter successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid plan change request' }, { status: 400 });
  } catch (error) {
    console.error('Plan change error:', error);
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 });
  }
} 