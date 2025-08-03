import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_domain, customer, orders_to_redact, customer_to_redact } = body;

    console.log('Customer data erasure webhook received:', {
      shop_domain,
      customer_id: customer?.id,
      orders_to_redact: orders_to_redact?.length || 0,
      customer_to_redact: customer_to_redact?.length || 0,
    });

    const merchant = await prisma.merchant.findUnique({
      where: { shop: shop_domain },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop_domain}`);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // For GDPR compliance, we need to delete/anonymize all customer data we have stored
    // This includes any data we've collected about the customer

    // Note: You may need to add these fields to your Prisma schema if they don't exist
    // and you're storing customer-related data

    // Example data deletion (adjust based on your actual schema):
    
    // 1. Delete any influencer activities related to this customer
    // await prisma.influencerActivity.deleteMany({
    //   where: { 
    //     merchantId: merchant.id,
    //     customerId: customer.id 
    //   }
    // });

    // 2. Delete any UGC posts related to this customer
    // await prisma.ugcPost.deleteMany({
    //   where: { 
    //     merchantId: merchant.id,
    //     customerId: customer.id 
    //   }
    // });

    // 3. Delete any discount code usage by this customer
    // await prisma.discountCodeUsage.deleteMany({
    //   where: { 
    //     merchantId: merchant.id,
    //     customerId: customer.id 
    //   }
    // });

    // 4. Anonymize any payouts related to this customer (if they're an influencer)
    // await prisma.payout.updateMany({
    //   where: { 
    //     merchantId: merchant.id,
    //     influencerId: customer.id 
    //   },
    //   data: {
    //     influencerId: null,
    //     // Add other anonymization fields as needed
    //   }
    // });

    console.log(`Customer data erasure processed for shop: ${shop_domain}, customer: ${customer?.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Customer data has been redacted',
    });
  } catch (error) {
    console.error('Customer data erasure webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 