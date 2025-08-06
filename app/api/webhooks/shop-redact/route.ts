import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_domain, shop_id } = body;

    console.log('Shop data erasure webhook received:', {
      shop_domain,
      shop_id,
    });

    const merchant = await prisma.merchant.findUnique({
      where: { shop: shop_domain },
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
      console.log(`No merchant found for shop: ${shop_domain}`);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    console.log(`Starting GDPR data erasure for shop: ${shop_domain} - Merchant ID: ${merchant.id}`);
    console.log(`Data to be deleted: ${merchant.influencers.length} influencers, ${merchant.ugcPosts.length} UGC posts, ${merchant.discountCodes.length} discount codes, ${merchant.payouts.length} payouts`);

    // For GDPR compliance, we need to completely delete all shop data
    // This is more comprehensive than app uninstall as it's for data privacy

    // Cancel any active subscriptions first
    if (merchant.subscription) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: { status: 'CANCELED' },
      });
      console.log(`Cancelled subscription for GDPR erasure: ${shop_domain}`);
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
      where: { shop: shop_domain },
    });

    console.log(`✅ Successfully deleted merchant and all related data for GDPR erasure: ${shop_domain}`);

    return NextResponse.json({
      success: true,
      message: 'Shop data has been completely erased for GDPR compliance',
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
    console.error('Shop data erasure webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 