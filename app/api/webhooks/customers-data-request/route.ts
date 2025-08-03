import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_domain, customer, orders_to_redact, customer_to_redact } = body;

    console.log('Customer data request webhook received:', {
      shop_domain,
      customer_id: customer?.id,
      orders_to_redact: orders_to_redact?.length || 0,
      customer_to_redact: customer_to_redact?.length || 0,
    });

    // For GDPR compliance, we need to return all customer data we have stored
    // This includes any data we've collected about the customer
    
    const merchant = await prisma.merchant.findUnique({
      where: { shop: shop_domain },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop_domain}`);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Collect all data we have about this customer
    const customerData = {
      // Basic customer info if we have it
      customer: customer || null,
      
      // Any orders we've processed for this customer
      orders: orders_to_redact || [],
      
      // Any influencer activities related to this customer
      influencerActivities: [], // You might have this data in your schema
      
      // Any UGC posts related to this customer
      ugcPosts: [], // You might have this data in your schema
      
      // Any discount codes used by this customer
      discountCodes: [], // You might have this data in your schema
      
      // Any payouts related to this customer (if they're an influencer)
      payouts: [], // You might have this data in your schema
    };

    console.log(`Customer data request processed for shop: ${shop_domain}, customer: ${customer?.id}`);
    
    return NextResponse.json({
      success: true,
      data: customerData,
    });
  } catch (error) {
    console.error('Customer data request webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 