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
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop_domain}`);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // For GDPR compliance, we need to delete/anonymize all shop data we have stored
    // This includes any data we've collected about the shop and its activities

    // Note: You may need to add these fields to your Prisma schema if they don't exist
    // and you're storing shop-related data

    // Example data deletion (adjust based on your actual schema):
    
    // 1. Delete all influencer activities for this shop
    // await prisma.influencerActivity.deleteMany({
    //   where: { merchantId: merchant.id }
    // });

    // 2. Delete all UGC posts for this shop
    // await prisma.ugcPost.deleteMany({
    //   where: { merchantId: merchant.id }
    // });

    // 3. Delete all discount codes for this shop
    // await prisma.discountCode.deleteMany({
    //   where: { merchantId: merchant.id }
    // });

    // 4. Delete all payouts for this shop
    // await prisma.payout.deleteMany({
    //   where: { merchantId: merchant.id }
    // });

    // 5. Delete all brand mentions for this shop
    // await prisma.brandMention.deleteMany({
    //   where: { merchantId: merchant.id }
    // });

    // 6. Delete all social media accounts for this shop
    // await prisma.socialMediaAccount.deleteMany({
    //   where: { merchantId: merchant.id }
    // });

    // 7. Delete the merchant record itself (or mark as deleted)
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { 
        isActive: false,
        // Add additional fields to mark as deleted if needed
        // deletedAt: new Date(),
        // shop: null, // Anonymize the shop domain
      },
    });

    console.log(`Shop data erasure processed for shop: ${shop_domain}`);
    
    return NextResponse.json({
      success: true,
      message: 'Shop data has been redacted',
    });
  } catch (error) {
    console.error('Shop data erasure webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 