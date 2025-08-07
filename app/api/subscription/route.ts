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

    console.log('🔍 Subscription API - Merchant found:', {
      id: merchant.id,
      shop: merchant.shop,
      hasSubscription: !!merchant.subscription,
    });

    // Get usage data
    const usage = await getSubscriptionUsage(merchant.id);

    if (!merchant.subscription) {
      console.log('📋 No subscription found, returning Starter limits');
      return NextResponse.json({
        success: true,
        subscription: null,
        usage: {
          ugcCount: usage.ugcCount,
          influencerCount: usage.influencerCount,
          ugcLimit: usage.ugcLimit,
          influencerLimit: usage.influencerLimit,
        },
        plan: {
          name: 'Starter',
          ugcLimit: usage.ugcLimit,
          influencerLimit: usage.influencerLimit,
        },
      });
    }

    const subscription = merchant.subscription;
    const plan = subscription.plan;

    console.log('📋 Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      stripeSubId: subscription.stripeSubId,
      planName: plan.name,
      planId: plan.id,
      ugcLimit: plan.ugcLimit,
      influencerLimit: plan.influencerLimit,
    });

    // 🛡️ PRODUCTION SAFEGUARD: Auto-correct if wrong plan assigned
    if (subscription.stripeSubId && plan.name === 'Starter') {
      console.log('⚠️ WARNING: Paid subscription has Starter plan - auto-correcting to Scale');
      
      const scalePlan = await prisma.plan.findUnique({
        where: { name: 'Scale' },
      });

      if (scalePlan) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            planId: scalePlan.id,
            updatedAt: new Date(),
          },
        });

        console.log('✅ Auto-corrected subscription to Scale plan');
        
        // Update the plan reference
        plan.name = 'Scale';
        plan.ugcLimit = scalePlan.ugcLimit;
        plan.influencerLimit = scalePlan.influencerLimit;
      }
    }

    // Validate plan limits match expected values
    const expectedLimits = {
      'Pro': { ugcLimit: 300, influencerLimit: 10 },
      'Scale': { ugcLimit: 1000, influencerLimit: 50 },
      'Enterprise': { ugcLimit: -1, influencerLimit: -1 },
      'Starter': { ugcLimit: 5, influencerLimit: 1 },
    };

    const expected = expectedLimits[plan.name as keyof typeof expectedLimits];
    if (expected && (plan.ugcLimit !== expected.ugcLimit || plan.influencerLimit !== expected.influencerLimit)) {
      console.error('❌ CRITICAL: Plan limits mismatch in database!');
      console.error('❌ Expected:', expected);
      console.error('❌ Actual:', { ugcLimit: plan.ugcLimit, influencerLimit: plan.influencerLimit });
      
      // Auto-correct the plan limits
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          ugcLimit: expected.ugcLimit,
          influencerLimit: expected.influencerLimit,
        },
      });
      
      console.log('✅ Auto-corrected plan limits in database');
      plan.ugcLimit = expected.ugcLimit;
      plan.influencerLimit = expected.influencerLimit;
    }

    console.log('✅ Final subscription data:', {
      planName: plan.name,
      ugcLimit: plan.ugcLimit,
      influencerLimit: plan.influencerLimit,
      usage: {
        ugcCount: usage.ugcCount,
        influencerCount: usage.influencerCount,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeSubId: subscription.stripeSubId,
      },
      plan: {
        name: plan.name,
        ugcLimit: plan.ugcLimit,
        influencerLimit: plan.influencerLimit,
      },
      usage: {
        ugcCount: usage.ugcCount,
        influencerCount: usage.influencerCount,
        ugcLimit: plan.ugcLimit,
        influencerLimit: plan.influencerLimit,
      },
    });

  } catch (error) {
    console.error('❌ Subscription API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
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