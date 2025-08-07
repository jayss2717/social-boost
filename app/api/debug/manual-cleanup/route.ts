import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    console.log('🔍 Manual cleanup requested for shop:', shop);

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

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
        orderMetrics: true,
        ugcRejections: true,
        ugcWorkflowRules: true,
        settings: true,
      },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop}`);
      return NextResponse.json({ 
        success: true, 
        message: 'No merchant found to delete',
        shop 
      });
    }

    console.log(`Starting manual data cleanup for shop: ${shop} - Merchant ID: ${merchant.id}`);
    console.log(`Data to be deleted: ${merchant.influencers.length} influencers, ${merchant.ugcPosts.length} UGC posts, ${merchant.discountCodes.length} discount codes, ${merchant.payouts.length} payouts`);

    // Cancel any active subscriptions first
    if (merchant.subscription) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: { status: 'CANCELED' },
      });
      console.log(`Cancelled subscription for shop: ${shop}`);
    }

    // Delete all related data (this will cascade due to onDelete: Cascade)
    // The cascade will automatically delete:
    // - All influencers (and their related data)
    // - All UGC posts
    // - All discount codes
    // - All payouts
    // - All social media accounts
    // - All brand mentions
    // - All order metrics
    // - All UGC rejections
    // - All UGC workflow rules
    // - Merchant settings

    // Delete the merchant (this will trigger cascade deletes)
    await prisma.merchant.delete({
      where: { shop },
    });

    console.log(`✅ Successfully deleted merchant and all related data for shop: ${shop}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Manual cleanup completed successfully',
      dataDeleted: {
        merchant: true,
        subscription: merchant.subscription ? true : false,
        influencers: merchant.influencers.length,
        ugcPosts: merchant.ugcPosts.length,
        discountCodes: merchant.discountCodes.length,
        payouts: merchant.payouts.length,
        socialMediaAccounts: merchant.socialMediaAccounts.length,
        brandMentions: merchant.brandMentions.length,
        orderMetrics: merchant.orderMetrics.length,
        ugcRejections: merchant.ugcRejections.length,
        ugcWorkflowRules: merchant.ugcWorkflowRules.length,
        settings: merchant.settings ? true : false,
      }
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    return NextResponse.json({ error: 'Manual cleanup failed' }, { status: 500 });
  }
} 