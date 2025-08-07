import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🔍 Starting cleanup job for uninstalled apps...');

    // Get all active merchants
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        shop: true,
        accessToken: true,
      },
    });

    console.log(`Found ${merchants.length} active merchants to check`);

    let cleanedUpCount = 0;

    for (const merchant of merchants) {
      try {
        // Test the access token by making a simple API call
        const response = await fetch(`https://${merchant.shop}/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': merchant.accessToken,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.log(`⚠️ Access token invalid for shop: ${merchant.shop}, cleaning up...`);
          
          // Cancel subscription first
          await prisma.subscription.updateMany({
            where: { merchantId: merchant.id },
            data: { status: 'CANCELED' },
          });

          // Delete merchant (this will cascade delete all related data)
          await prisma.merchant.delete({
            where: { id: merchant.id },
          });

          console.log(`✅ Cleaned up uninstalled app data for shop: ${merchant.shop}`);
          cleanedUpCount++;
        } else {
          console.log(`✅ Access token valid for shop: ${merchant.shop}`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking access token for shop: ${merchant.shop}, cleaning up...`);
        
        // If we can't verify the token, assume the app is uninstalled
        await prisma.subscription.updateMany({
          where: { merchantId: merchant.id },
          data: { status: 'CANCELED' },
        });

        await prisma.merchant.delete({
          where: { id: merchant.id },
        });

        console.log(`✅ Cleaned up uninstalled app data for shop: ${merchant.shop}`);
        cleanedUpCount++;
      }
    }

    console.log(`✅ Cleanup job completed. Cleaned up ${cleanedUpCount} uninstalled apps`);

    return NextResponse.json({
      success: true,
      message: 'Cleanup job completed',
      merchantsChecked: merchants.length,
      merchantsCleanedUp: cleanedUpCount,
    });
  } catch (error) {
    console.error('Cleanup job error:', error);
    return NextResponse.json({ error: 'Cleanup job failed' }, { status: 500 });
  }
} 