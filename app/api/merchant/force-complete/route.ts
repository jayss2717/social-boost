import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    console.log(`Force completing OAuth for shop: ${shop}`);

    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Force complete the OAuth by setting proper values
    const updatedMerchant = await prisma.merchant.update({
      where: { shop },
      data: {
        accessToken: `force-completed-${Date.now()}`,
        shopifyShopId: shop,
        scope: 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products',
        isActive: true,
        onboardingCompleted: true, // Skip onboarding for now
      },
    });

    console.log(`Force completed OAuth for shop: ${shop}`);

    return NextResponse.json({
      success: true,
      message: 'OAuth force completed',
      merchant: {
        id: updatedMerchant.id,
        shop: updatedMerchant.shop,
        accessToken: updatedMerchant.accessToken ? 'SET' : 'MISSING',
        shopifyShopId: updatedMerchant.shopifyShopId,
        isActive: updatedMerchant.isActive,
        onboardingCompleted: updatedMerchant.onboardingCompleted,
      },
    });
  } catch (error) {
    console.error('Force complete error:', error);
    return NextResponse.json({ error: 'Force complete failed' }, { status: 500 });
  }
} 