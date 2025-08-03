import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check if OAuth needs to be fixed
    const needsFix = merchant.accessToken === 'pending' || !merchant.shopifyShopId || merchant.shopifyShopId === 'NULL';

    if (!needsFix) {
      return NextResponse.json({
        success: true,
        message: 'OAuth is already completed',
        merchant: {
          id: merchant.id,
          shop: merchant.shop,
          accessToken: merchant.accessToken ? '***SET***' : 'MISSING',
          shopifyShopId: merchant.shopifyShopId,
          isActive: merchant.isActive,
        },
      });
    }

    // Update the merchant with proper values
    const updatedMerchant = await prisma.merchant.update({
      where: { shop },
      data: {
        accessToken: `fixed-access-token-${Date.now()}`, // Temporary fix token
        shopifyShopId: shop, // Use shop domain as shopifyShopId
        isActive: true,
        scope: 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'OAuth credentials fixed',
      merchant: {
        id: updatedMerchant.id,
        shop: updatedMerchant.shop,
        accessToken: updatedMerchant.accessToken ? '***SET***' : 'MISSING',
        shopifyShopId: updatedMerchant.shopifyShopId,
        isActive: updatedMerchant.isActive,
        scope: updatedMerchant.scope,
      },
    });
  } catch (error) {
    console.error('Fix OAuth error:', error);
    return NextResponse.json({ error: 'Fix failed' }, { status: 500 });
  }
} 