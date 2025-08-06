import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔍 Checking all merchants for shop:', shop);

    // Find all merchants with this shop name
    const merchants = await prisma.merchant.findMany({
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    console.log(`✅ Found ${merchants.length} merchants for shop: ${shop}`);

    const merchantDetails = merchants.map(merchant => ({
      id: merchant.id,
      shop: merchant.shop,
      shopName: merchant.shopName,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
      subscription: merchant.subscription ? {
        id: merchant.subscription.id,
        status: merchant.subscription.status,
        currentPeriodEnd: merchant.subscription.currentPeriodEnd,
        stripeSubId: merchant.subscription.stripeSubId,
        plan: {
          id: merchant.subscription.plan.id,
          name: merchant.subscription.plan.name,
          priceCents: merchant.subscription.plan.priceCents,
          ugcLimit: merchant.subscription.plan.ugcLimit,
          influencerLimit: merchant.subscription.plan.influencerLimit,
        }
      } : null,
    }));

    return NextResponse.json({
      shop,
      totalMerchants: merchants.length,
      merchants: merchantDetails,
    });

  } catch (error) {
    console.error('❌ Error checking all merchants:', error);
    return NextResponse.json({ error: 'Failed to check merchants' }, { status: 500 });
  }
} 