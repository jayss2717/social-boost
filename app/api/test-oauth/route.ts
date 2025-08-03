import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Check if OAuth has completed
    const oauthCompleted = merchant.accessToken && merchant.accessToken !== 'pending';
    const shopifyShopIdSet = merchant.shopifyShopId && merchant.shopifyShopId !== 'NULL';

    return NextResponse.json({
      shop: merchant.shop,
      accessToken: merchant.accessToken,
      shopifyShopId: merchant.shopifyShopId,
      oauthCompleted,
      shopifyShopIdSet,
      merchantId: merchant.id,
      isActive: merchant.isActive,
      onboardingCompleted: merchant.onboardingCompleted,
    });
  } catch (error) {
    console.error('Test OAuth error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 