import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify';

interface OrderMetric {
  orderId: string;
  totalAmount: number;
  currency: string;
  discountCodesUsed: number;
  customerEmail: string | null;
  processedAt: Date;
}

interface DiscountCodeWithInfluencer {
  id: string;
  code: string;
  usageCount: number;
  discountValue: number;
  discountType: string;
  createdAt: Date;
  influencer?: {
    name: string;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    const period = request.nextUrl.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
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
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get merchant details
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { shop: true, accessToken: true }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get comprehensive metrics
    const [
      totalDiscountCodes,
      activeDiscountCodes,
      totalUsage,
      totalRevenue,
      influencerCount,
      ugcPostCount,
      payoutData,
      orderMetrics,
      topPerformingCodes,
      recentActivity
    ] = await Promise.all([
      // Total discount codes created
      prisma.discountCode.count({
        where: { 
          merchantId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Active discount codes
      prisma.discountCode.count({
        where: { 
          merchantId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        }
      }),
      
      // Total usage count
      prisma.discountCode.aggregate({
        where: { merchantId },
        _sum: { usageCount: true }
      }),
      
      // Total revenue from orders (placeholder for now)
      Promise.resolve({ _sum: { totalAmount: 0 } }),
      
      // Influencer count
      prisma.influencer.count({
        where: { 
          merchantId,
          isActive: true
        }
      }),
      
      // UGC posts count
      prisma.ugcPost.count({
        where: { 
          merchantId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Payout data
      prisma.payout.aggregate({
        where: { 
          merchantId,
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Order metrics (placeholder for now)
      Promise.resolve([] as OrderMetric[]),
      
      // Top performing discount codes
      prisma.discountCode.findMany({
        where: { 
          merchantId,
          usageCount: { gt: 0 }
        },
        include: {
          influencer: {
            select: { name: true }
          }
        },
        orderBy: { usageCount: 'desc' },
        take: 5
      }),
      
      // Recent activity
      prisma.discountCode.findMany({
        where: { 
          merchantId,
          createdAt: { gte: startDate }
        },
        include: {
          influencer: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Get Shopify analytics if access token is available
    let shopifyAnalytics = null;
    if (merchant.accessToken) {
      try {
        const shopifyAPI = new ShopifyAPI(merchant.accessToken, merchant.shop);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = now.toISOString().split('T')[0];
        
        shopifyAnalytics = await shopifyAPI.getUsageAnalytics(startDateStr, endDateStr);
      } catch (error) {
        console.error('Failed to get Shopify analytics:', error);
      }
    }

    // Calculate conversion rates and performance metrics
    const conversionRate = totalDiscountCodes > 0 ? (totalUsage._sum.usageCount || 0) / totalDiscountCodes : 0;
    const averageOrderValue = orderMetrics.length > 0 
      ? orderMetrics.reduce((sum: number, order: OrderMetric) => sum + order.totalAmount, 0) / orderMetrics.length 
      : 0;

    const metrics = {
      period,
      summary: {
        totalDiscountCodes,
        activeDiscountCodes,
        totalUsage: totalUsage._sum.usageCount || 0,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        influencerCount,
        ugcPostCount,
        totalPayouts: payoutData._count || 0,
        totalPayoutAmount: payoutData._sum.amount || 0,
      },
      performance: {
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue / 100 * 100) / 100, // Convert from cents to dollars
        averagePayoutAmount: payoutData._count > 0 
          ? Math.round((payoutData._sum.amount || 0) / payoutData._count / 100 * 100) / 100 
          : 0,
      },
      topPerformingCodes: topPerformingCodes.map((code: DiscountCodeWithInfluencer) => ({
        id: code.id,
        code: code.code,
        usageCount: code.usageCount,
        influencerName: code.influencer?.name || 'Unknown',
        discountValue: code.discountValue,
        discountType: code.discountType,
      })),
      recentActivity: recentActivity.map((code: DiscountCodeWithInfluencer) => ({
        id: code.id,
        code: code.code,
        createdAt: code.createdAt,
        influencerName: code.influencer?.name || 'Unknown',
        discountValue: code.discountValue,
        discountType: code.discountType,
      })),
      orderMetrics: orderMetrics.map((order: OrderMetric) => ({
        orderId: order.orderId,
        totalAmount: order.totalAmount / 100, // Convert from cents to dollars
        currency: order.currency,
        discountCodesUsed: order.discountCodesUsed,
        customerEmail: order.customerEmail,
        processedAt: order.processedAt,
      })),
      shopifyAnalytics,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
} 