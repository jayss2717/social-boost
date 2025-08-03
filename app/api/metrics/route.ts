import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const period = searchParams.get('period') || '30d';

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        influencers: true,
        ugcPosts: true,
        discountCodes: true,
        payouts: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get metrics for the period
    const metrics = {
      totalInfluencers: merchant.influencers.length,
      activeInfluencers: merchant.influencers.filter(i => i.isActive).length,
      totalUgcPosts: merchant.ugcPosts.length,
      approvedUgcPosts: merchant.ugcPosts.filter(p => p.isApproved).length,
      pendingUgcPosts: merchant.ugcPosts.filter(p => !p.isApproved && !p.isRejected).length,
      rejectedUgcPosts: merchant.ugcPosts.filter(p => p.isRejected).length,
      totalDiscountCodes: merchant.discountCodes.length,
      usedDiscountCodes: merchant.discountCodes.filter(c => c.usageCount > 0).length,
      totalPayouts: merchant.payouts.length,
      totalPayoutAmount: merchant.payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
      period: period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      metrics,
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        shopName: merchant.shopName,
        isActive: merchant.isActive,
      },
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
} 