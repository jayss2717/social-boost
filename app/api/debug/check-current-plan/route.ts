import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/utils/subscription';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔍 Checking plan for shop:', shop);

    // Find merchant by shop
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

    console.log('✅ Merchant found:', {
      id: merchant.id,
      shop: merchant.shop,
      shopName: merchant.shopName,
    });

    if (!merchant.subscription) {
      return NextResponse.json({ 
        error: 'No subscription found',
        merchant: {
          id: merchant.id,
          shop: merchant.shop,
          shopName: merchant.shopName,
        }
      }, { status: 404 });
    }

    const subscription = merchant.subscription;
    const plan = subscription.plan;
    
    console.log('📋 Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      stripeSubId: subscription.stripeSubId,
    });

    console.log('📋 Plan details:', {
      id: plan.id,
      name: plan.name,
      priceCents: plan.priceCents,
      ugcLimit: plan.ugcLimit,
      influencerLimit: plan.influencerLimit,
    });

    // Get actual limits from the function
    const actualLimits = getPlanLimits(plan.name);
    
    console.log('📋 Actual limits from function:', actualLimits);

    // Get current usage
    const [ugcCount, influencerCount] = await Promise.all([
      prisma.ugcPost.count({ where: { merchantId: merchant.id } }),
      prisma.influencer.count({ where: { merchantId: merchant.id } }),
    ]);

    console.log('📊 Current usage:', {
      ugcCount,
      influencerCount,
    });

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        shopName: merchant.shopName,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeSubId: subscription.stripeSubId,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        ugcLimit: plan.ugcLimit,
        influencerLimit: plan.influencerLimit,
      },
      actualLimits,
      usage: {
        ugcCount,
        influencerCount,
      },
    });

  } catch (error) {
    console.error('❌ Error checking current plan:', error);
    return NextResponse.json({ error: 'Failed to check current plan' }, { status: 500 });
  }
} 