import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
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

    console.log(`Subscription verification for ${shop}:`, {
      hasSubscription: !!merchant.subscription,
      planName: merchant.subscription?.plan?.name,
      stripeSubId: merchant.subscription?.stripeSubId,
    });

    // If no subscription exists, create a default Starter subscription
    if (!merchant.subscription) {
      console.log(`Creating default Starter subscription for ${shop}`);
      
      const starterPlan = await prisma.plan.findUnique({
        where: { name: 'Starter' },
      });

      if (!starterPlan) {
        return NextResponse.json({ error: 'Starter plan not found' }, { status: 500 });
      }

      await prisma.subscription.create({
        data: {
          merchantId: merchant.id,
          planId: starterPlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Created default Starter subscription',
        action: 'created_starter',
      });
    }

    // If subscription has Stripe ID, verify with Stripe
    if (merchant.subscription.stripeSubId && stripe) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          merchant.subscription.stripeSubId
        );

        console.log(`Stripe subscription status: ${stripeSubscription.status}`);

        // Update subscription status based on Stripe
        if (stripeSubscription.status !== merchant.subscription.status.toLowerCase()) {
          await prisma.subscription.update({
            where: { id: merchant.subscription.id },
            data: {
              status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'CANCELED',
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
          });

          return NextResponse.json({
            success: true,
            message: 'Updated subscription status from Stripe',
            action: 'updated_status',
            stripeStatus: stripeSubscription.status,
          });
        }
      } catch (error) {
        console.error('Error verifying with Stripe:', error);
        
        // If Stripe subscription not found, mark as canceled
        await prisma.subscription.update({
          where: { id: merchant.subscription.id },
          data: {
            status: 'CANCELED',
            stripeSubId: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Stripe subscription not found, marked as canceled',
          action: 'marked_canceled',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription verified successfully',
      action: 'verified',
      subscription: {
        plan: merchant.subscription.plan?.name,
        status: merchant.subscription.status,
      },
    });
  } catch (error) {
    console.error('Subscription verification error:', error);
    return NextResponse.json({ error: 'Failed to verify subscription' }, { status: 500 });
  }
} 