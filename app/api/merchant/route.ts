import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        settings: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const response = {
      id: merchant.id,
      shop: merchant.shop,
      shopName: merchant.shopName,
      shopEmail: merchant.shopEmail,
      shopDomain: merchant.shopDomain,
      shopCurrency: merchant.shopCurrency,
      shopTimezone: merchant.shopTimezone,
      shopLocale: merchant.shopLocale,
      onboardingCompleted: merchant.onboardingCompleted,
      onboardingStep: merchant.onboardingStep,
      settings: merchant.settings,
    };
    
    console.log('Merchant API response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch merchant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 