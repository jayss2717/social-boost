import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Get merchant with OAuth credentials
    const merchant = await prisma.merchant.findUnique({
      where: { shop }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.accessToken || merchant.accessToken === 'pending') {
      return NextResponse.json({ error: 'OAuth not completed' }, { status: 401 });
    }

    // Fetch real Shopify data
    const shopifyData: any = {};

    try {
      // 1. Get shop information
      const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': merchant.accessToken,
        },
      });

      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        shopifyData.shop = shopData.shop;
      }

      // 2. Get products count
      const productsResponse = await fetch(`https://${shop}/admin/api/2024-01/products/count.json`, {
        headers: {
          'X-Shopify-Access-Token': merchant.accessToken,
        },
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        shopifyData.productsCount = productsData.count;
      }

      // 3. Get orders count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const ordersResponse = await fetch(
        `https://${shop}/admin/api/2024-01/orders/count.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}`,
        {
          headers: {
            'X-Shopify-Access-Token': merchant.accessToken,
          },
        }
      );

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        shopifyData.recentOrdersCount = ordersData.count;
      }

      // 4. Get customers count
      const customersResponse = await fetch(`https://${shop}/admin/api/2024-01/customers/count.json`, {
        headers: {
          'X-Shopify-Access-Token': merchant.accessToken,
        },
      });

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        shopifyData.customersCount = customersData.count;
      }

      // 5. Get recent orders for revenue calculation
      const recentOrdersResponse = await fetch(
        `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=50&created_at_min=${thirtyDaysAgo.toISOString()}`,
        {
          headers: {
            'X-Shopify-Access-Token': merchant.accessToken,
          },
        }
      );

      if (recentOrdersResponse.ok) {
        const ordersData = await recentOrdersResponse.json();
        const totalRevenue = ordersData.orders.reduce((sum: number, order: any) => {
          return sum + parseFloat(order.total_price || 0);
        }, 0);
        shopifyData.recentRevenue = totalRevenue;
        shopifyData.recentOrders = ordersData.orders.length;
      }

      // 6. Get app data from our database
      const appData = await prisma.$transaction([
        prisma.ugcPost.count({ where: { merchantId: merchant.id } }),
        prisma.influencer.count({ where: { merchantId: merchant.id, isActive: true } }),
        prisma.ugcPost.count({ where: { merchantId: merchant.id, isApproved: true } }),
        prisma.ugcPost.count({ where: { merchantId: merchant.id, isApproved: false } }),
        prisma.payout.aggregate({
          where: { merchantId: merchant.id, status: 'PENDING' },
          _sum: { amount: true }
        })
      ]);

      shopifyData.appMetrics = {
        totalUgcPosts: appData[0],
        activeInfluencers: appData[1],
        approvedPosts: appData[2],
        pendingApproval: appData[3],
        pendingPayouts: appData[4]._sum.amount || 0
      };

      return NextResponse.json({
        success: true,
        data: shopifyData
      });

    } catch (error) {
      console.error('Error fetching Shopify data:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch Shopify data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Shopify data API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 