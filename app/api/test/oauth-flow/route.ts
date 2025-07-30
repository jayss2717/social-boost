import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { shop } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Simulate OAuth callback merchant creation
    const merchant = await prisma.merchant.upsert({
      where: { shop },
      update: {
        isActive: true,
        onboardingCompleted: false,
        onboardingStep: 0,
      },
      create: {
        shop,
        accessToken: 'test-token',
        scope: 'read_products,write_products',
        isActive: true,
        shopifyShopId: '123456789',
        shopName: shop.replace('.myshopify.com', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        shopEmail: `admin@${shop}`,
        shopDomain: shop,
        shopCurrency: 'USD',
        shopTimezone: 'UTC',
        shopLocale: 'en',
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });

    console.log('Test merchant created:', merchant);

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        shopName: merchant.shopName,
        onboardingCompleted: merchant.onboardingCompleted,
      }
    });
  } catch (error) {
    console.error('Test OAuth flow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 