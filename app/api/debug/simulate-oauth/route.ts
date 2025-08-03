import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Simulate OAuth flow
    const mockAccessToken = `mock_token_${shop}_${Date.now()}`;
    const mockShopId = `mock_shop_${shop.replace('.myshopify.com', '')}_${Date.now()}`;
    const mockScope = 'read_products,write_products,read_orders,write_orders';

    console.log('🧪 Simulating OAuth flow for shop:', shop);
    console.log('🧪 Mock credentials:', {
      accessToken: mockAccessToken,
      shopifyShopId: mockShopId,
      scope: mockScope,
    });

    // Find or create merchant
    let merchant = await prisma.merchant.findUnique({
      where: { shop },
    });

    if (merchant) {
      // Update existing merchant with mock OAuth data
      merchant = await prisma.merchant.update({
        where: { shop },
        data: {
          accessToken: mockAccessToken,
          scope: mockScope,
          shopifyShopId: mockShopId,
          isActive: true,
          onboardingCompleted: true,
        },
      });
      console.log('✅ Updated existing merchant with mock OAuth data');
    } else {
      // Create new merchant with mock OAuth data
      merchant = await prisma.merchant.create({
        data: {
          shop,
          accessToken: mockAccessToken,
          scope: mockScope,
          shopifyShopId: mockShopId,
          shopName: shop.replace('.myshopify.com', ''),
          shopEmail: `admin@${shop}`,
          shopDomain: shop,
          shopCurrency: 'USD',
          shopTimezone: 'America/New_York',
          isActive: true,
          onboardingCompleted: true,
        },
      });
      console.log('✅ Created new merchant with mock OAuth data');
    }

    // Verify uniqueness
    const allMerchants = await prisma.merchant.findMany({
      select: {
        shop: true,
        accessToken: true,
        shopifyShopId: true,
      },
    });

    const duplicateTokens = allMerchants.filter(m => 
      m.accessToken === mockAccessToken && m.shop !== shop
    );
    const duplicateShopIds = allMerchants.filter(m => 
      m.shopifyShopId === mockShopId && m.shop !== shop
    );

    const uniquenessCheck = {
      accessTokenUnique: duplicateTokens.length === 0,
      shopIdUnique: duplicateShopIds.length === 0,
      totalMerchants: allMerchants.length,
    };

    return NextResponse.json({
      success: true,
      shop,
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        accessToken: merchant.accessToken,
        shopifyShopId: merchant.shopifyShopId,
        scope: merchant.scope,
        isActive: merchant.isActive,
        onboardingCompleted: merchant.onboardingCompleted,
      },
      simulation: {
        mockAccessToken,
        mockShopId,
        mockScope,
        uniquenessCheck,
      },
      message: 'OAuth simulation completed successfully',
    });
  } catch (error) {
    console.error('OAuth simulation error:', error);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
} 