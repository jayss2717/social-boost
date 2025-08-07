import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { shop } = body;

    // Verify Shopify webhook signature
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    const topicHeader = request.headers.get('x-shopify-topic');
    const shopHeader = request.headers.get('x-shopify-shop-domain');

    console.log('Webhook headers:', {
      hmac: hmacHeader ? 'present' : 'missing',
      topic: topicHeader,
      shop: shopHeader,
    });

    // Verify webhook signature if HMAC is present
    if (hmacHeader && process.env.SHOPIFY_API_SECRET) {
      const expectedHmac = crypto
        .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
        .update(rawBody, 'utf8')
        .digest('base64');

      if (hmacHeader !== expectedHmac) {
        console.error('Webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.log('⚠️ Skipping webhook signature verification (HMAC or secret not present)');
    }

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
        orderMetrics: true,
        ugcRejections: true,
        ugcWorkflowRules: true,
        settings: true,
      },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop}`);
      return NextResponse.json({ success: true, message: 'No merchant found' });
    }

    console.log(`Starting data cleanup for shop: ${shop} - Merchant ID: ${merchant.id}`);
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
      message: 'App uninstalled and all data deleted successfully',
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
    console.error('App uninstalled webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 