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

    // Get subscription data for limits
    const subscription = merchant.subscription;
    const plan = subscription?.plan;
    
    // Calculate usage metrics
    const ugcCount = merchant.ugcPosts.length;
    const influencerCount = merchant.influencers.filter(i => i.isActive).length;
    const ugcLimit = plan?.ugcLimit || 20;
    const influencerLimit = plan?.influencerLimit || 5;

    // Get metrics for the period
    const metrics = {
      summary: {
        totalDiscountCodes: merchant.discountCodes.length,
        activeDiscountCodes: merchant.discountCodes.filter(c => c.usageCount > 0).length,
        totalUsage: merchant.discountCodes.reduce((sum, c) => sum + (c.usageCount || 0), 0),
        totalRevenue: merchant.payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
        influencerCount: influencerCount,
        ugcCount: ugcCount,
        ugcLimit: ugcLimit,
        influencerLimit: influencerLimit,
        totalPayouts: merchant.payouts.length,
        totalPayoutAmount: merchant.payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
      },
      performance: {
        conversionRate: merchant.discountCodes.length > 0 ? 
          (merchant.discountCodes.filter(c => c.usageCount > 0).length / merchant.discountCodes.length) : 0,
        averageOrderValue: merchant.payouts.length > 0 ? 
          (merchant.payouts.reduce((sum, p) => sum + (p.amount || 0), 0) / merchant.payouts.length) : 0,
        averagePayoutAmount: merchant.payouts.length > 0 ? 
          (merchant.payouts.reduce((sum, p) => sum + (p.amount || 0), 0) / merchant.payouts.length) : 0,
      },
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