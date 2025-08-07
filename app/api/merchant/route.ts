import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    // Use shop parameter, fallback to host
    const shopDomain = shop || host;

    if (!shopDomain) {
      return NextResponse.json({ error: 'Shop or host parameter required' }, { status: 400 });
    }

    console.log(`🔍 Fetching merchant for shop: ${shopDomain}`);

    const merchant = await prisma.merchant.findUnique({
      where: { shop: shopDomain },
      include: {
        subscription: true,
        settings: true,
      },
    });

    if (!merchant) {
      // Don't create merchant automatically - only during OAuth installation
      console.log(`❌ No merchant found for shop: ${shopDomain}`);
      console.log(`❌ This could be an uninstalled app or invalid request`);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check if the access token is still valid by making a test API call
    try {
      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': merchant.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`⚠️ Access token invalid for shop: ${shopDomain}, triggering cleanup`);
        
        // Token is invalid - app has been uninstalled
        // Trigger the same cleanup logic as the webhook
        await prisma.subscription.updateMany({
          where: { merchantId: merchant.id },
          data: { status: 'CANCELED' },
        });

        await prisma.merchant.delete({
          where: { id: merchant.id },
        });

        console.log(`✅ Cleaned up uninstalled app data for shop: ${shopDomain}`);
        return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
      }
    } catch (error) {
      console.log(`⚠️ Error checking access token for shop: ${shopDomain}, assuming app uninstalled`);
      
      // If we can't verify the token, assume the app is uninstalled
      await prisma.subscription.updateMany({
        where: { merchantId: merchant.id },
        data: { status: 'CANCELED' },
      });

      await prisma.merchant.delete({
        where: { id: merchant.id },
      });

      console.log(`✅ Cleaned up uninstalled app data for shop: ${shopDomain}`);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Token is valid, return merchant data
    console.log(`✅ Found merchant for shop: ${shopDomain}`);
    return NextResponse.json({
      id: merchant.id,
      shop: merchant.shop,
      onboardingCompleted: merchant.onboardingCompleted,
      accessToken: 'SET', // Don't expose the actual token
      shopifyShopId: merchant.shopifyShopId,
      isActive: merchant.isActive,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
      subscription: merchant.subscription,
      settings: merchant.settings,
    });
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 });
  }
} 