import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId parameter' }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        settings: true,
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

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        name: merchant.shopName,
        email: merchant.shopEmail,
        onboardingCompleted: merchant.onboardingCompleted,
        subscription: merchant.subscription ? {
          id: merchant.subscription.id,
          status: merchant.subscription.status,
          plan: merchant.subscription.plan ? {
            id: merchant.subscription.plan.id,
            name: merchant.subscription.plan.name,
            priceCents: merchant.subscription.plan.priceCents,
            ugcLimit: merchant.subscription.plan.ugcLimit,
            influencerLimit: merchant.subscription.plan.influencerLimit,
          } : null,
        } : null,
      },
    });
  } catch (error) {
    console.error('Merchant by ID API error:', error);
    return NextResponse.json({ error: 'Failed to fetch merchant data' }, { status: 500 });
  }
} 