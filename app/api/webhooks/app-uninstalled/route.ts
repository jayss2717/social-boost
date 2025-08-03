import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    console.log(`App uninstalled webhook received for shop: ${shop}`);

    // Find the merchant first
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: { 
        subscription: true,
        influencers: true,
        ugcPosts: true,
        discountCodes: true,
        payouts: true,
        socialMediaAccounts: true,
        brandMentions: true,
      },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop}`);
      return NextResponse.json({ success: true, message: 'No merchant found' });
    }

    // Cancel any active subscriptions
    if (merchant.subscription) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: { status: 'CANCELED' },
      });
      console.log(`Cancelled subscription for shop: ${shop}`);
    }

    // Soft delete the merchant (mark as inactive and clear sensitive data)
    await prisma.merchant.update({
      where: { shop },
      data: { 
        isActive: false,
        accessToken: null, // Clear sensitive OAuth data
        scope: null,
        shopifyShopId: null,
        // Keep basic info for potential reinstallation
      },
    });

    // Log the uninstallation for analytics
    console.log(`App uninstalled for shop: ${shop} - Merchant ID: ${merchant.id}`);
    console.log(`Data summary: ${merchant.influencers.length} influencers, ${merchant.ugcPosts.length} UGC posts, ${merchant.discountCodes.length} discount codes`);

    return NextResponse.json({ 
      success: true, 
      message: 'App uninstalled successfully',
      dataCleared: {
        accessToken: true,
        scope: true,
        shopifyShopId: true,
      }
    });
  } catch (error) {
    console.error('App uninstalled webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 