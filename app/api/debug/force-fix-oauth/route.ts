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

    // Force update OAuth credentials
    const updatedMerchant = await prisma.merchant.update({
      where: { shop },
      data: {
        accessToken: 'FORCE_FIXED_TOKEN_' + Date.now(),
        shopifyShopId: shop.replace('.myshopify.com', '') + '_' + Date.now(),
        scope: 'read_products,write_products,read_orders,write_orders',
        isActive: true,
        onboardingCompleted: true,
      },
    });

    console.log('🔧 Force-fixed OAuth for shop:', shop);
    console.log('🔧 Updated merchant:', {
      id: updatedMerchant.id,
      accessToken: updatedMerchant.accessToken ? 'SET' : 'MISSING',
      shopifyShopId: updatedMerchant.shopifyShopId,
    });

    return NextResponse.json({
      success: true,
      shop,
      merchant: {
        id: updatedMerchant.id,
        accessToken: updatedMerchant.accessToken ? 'SET' : 'MISSING',
        shopifyShopId: updatedMerchant.shopifyShopId,
        isActive: updatedMerchant.isActive,
        onboardingCompleted: updatedMerchant.onboardingCompleted,
      },
      message: 'OAuth credentials force-fixed for testing',
    });
  } catch (error) {
    console.error('Force-fix OAuth error:', error);
    return NextResponse.json({ error: 'Force-fix failed' }, { status: 500 });
  }
} 