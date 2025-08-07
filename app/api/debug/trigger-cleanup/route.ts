import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    console.log('🔧 Manual cleanup trigger requested for shop:', shop);

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Find the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      select: {
        id: true,
        shop: true,
        accessToken: true,
      },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop}`);
      return NextResponse.json({ 
        success: true, 
        message: 'No merchant found to clean up',
        shop 
      });
    }

    console.log(`🔍 Checking access token for shop: ${shop} (ID: ${merchant.id})`);

    try {
      // Test the access token
      const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': merchant.accessToken,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 API response for ${shop}: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.log(`⚠️ Access token invalid for shop: ${shop}, cleaning up...`);
        
        // Cancel subscription first
        await prisma.subscription.updateMany({
          where: { merchantId: merchant.id },
          data: { status: 'CANCELED' },
        });

        // Delete merchant (this will cascade delete all related data)
        await prisma.merchant.delete({
          where: { id: merchant.id },
        });

        console.log(`✅ Cleaned up uninstalled app data for shop: ${shop}`);

        return NextResponse.json({
          success: true,
          message: 'App was uninstalled, data cleaned up successfully',
          shop,
          action: 'cleaned_up',
          reason: 'invalid_access_token',
        });
      } else {
        console.log(`✅ Access token valid for shop: ${shop}, app is still installed`);
        
        return NextResponse.json({
          success: true,
          message: 'App is still installed, no cleanup needed',
          shop,
          action: 'no_action',
          reason: 'valid_access_token',
        });
      }
    } catch (error) {
      console.log(`⚠️ Error checking access token for shop: ${shop}, cleaning up...`);
      console.log(`Error details:`, error);
      
      // If we can't verify the token, assume the app is uninstalled
      await prisma.subscription.updateMany({
        where: { merchantId: merchant.id },
        data: { status: 'CANCELED' },
      });

      await prisma.merchant.delete({
        where: { id: merchant.id },
      });

      console.log(`✅ Cleaned up uninstalled app data for shop: ${shop}`);

      return NextResponse.json({
        success: true,
        message: 'App was uninstalled, data cleaned up successfully',
        shop,
        action: 'cleaned_up',
        reason: 'token_verification_error',
      });
    }
  } catch (error) {
    console.error('Trigger cleanup error:', error);
    return NextResponse.json({ error: 'Trigger cleanup failed' }, { status: 500 });
  }
} 