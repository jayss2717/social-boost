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

    // Get merchant data
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      select: {
        id: true,
        shop: true,
        accessToken: true,
        shopifyShopId: true,
        scope: true,
        isActive: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if OAuth callback was called recently
    const recentLogs = await prisma.merchant.findMany({
      where: {
        shop,
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      select: {
        updatedAt: true,
        accessToken: true,
        shopifyShopId: true,
      },
    });

    return NextResponse.json({
      success: true,
      shop,
      merchant,
      recentActivity: recentLogs.length > 0,
      oauthStatus: {
        hasAccessToken: merchant?.accessToken && merchant.accessToken !== 'pending',
        hasShopId: !!merchant?.shopifyShopId,
        isActive: merchant?.isActive,
        onboardingCompleted: merchant?.onboardingCompleted,
      },
      debug: {
        currentTime: new Date().toISOString(),
        merchantExists: !!merchant,
        accessTokenValue: merchant?.accessToken,
        shopIdValue: merchant?.shopifyShopId,
      },
    });
  } catch (error) {
    console.error('Debug OAuth flow error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
} 