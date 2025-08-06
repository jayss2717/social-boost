import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });
    }

    const { plan } = await request.json();
    
    const planPrices = {
      Pro: process.env.STRIPE_PRO_PRICE_ID,
      Scale: process.env.STRIPE_SCALE_PRICE_ID,
      Enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    const priceId = planPrices[plan as keyof typeof planPrices];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get the shop parameter for proper redirect handling
    const shop = merchant.shop;
    
    // Extract store name from shop URL
    const storeName = shop.replace('.myshopify.com', '');
    
    // Create proper Shopify app URLs using the correct app handle
    const shopifyAppUrl = `https://${shop}/admin/apps/socialboost-2`;
    
    // Create or find customer with proper metadata
    let customer;
    const existingCustomers = await stripe.customers.list({
      limit: 100,
    });
    
    customer = existingCustomers.data.find(c => c.metadata?.shop === shop);
    
    if (!customer) {
      // Create new customer with proper metadata
      customer = await stripe.customers.create({
        email: merchant.shopEmail || `${storeName}@example.com`,
        metadata: {
          shop: shop,
          merchantId: merchant.id,
          shopName: merchant.shopName || storeName,
        },
        name: merchant.shopName || storeName,
      });
      console.log('✅ Created new Stripe customer with metadata:', {
        id: customer.id,
        shop: shop,
        merchantId: merchant.id,
      });
    } else {
      // Update existing customer metadata to ensure it's correct
      if (customer.metadata?.shop !== shop || customer.metadata?.merchantId !== merchant.id) {
        customer = await stripe.customers.update(customer.id, {
          metadata: {
            shop: shop,
            merchantId: merchant.id,
            shopName: merchant.shopName || storeName,
          },
        });
        console.log('✅ Updated existing Stripe customer metadata:', {
          id: customer.id,
          shop: shop,
          merchantId: merchant.id,
        });
      }
    }

    // Create checkout session with enhanced metadata
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${shopifyAppUrl}?payment_success=true&plan=${plan}`,
      cancel_url: `${shopifyAppUrl}?payment_canceled=true`,
      metadata: {
        shop: shop,
        merchantId: merchant.id,
        plan: plan,
        shopName: merchant.shopName || storeName,
      },
      subscription_data: {
        metadata: {
          shop: shop,
          merchantId: merchant.id,
          plan: plan,
          shopName: merchant.shopName || storeName,
        },
      },
    });

    console.log('✅ Created checkout session with enhanced metadata:', {
      sessionId: session.id,
      shop: shop,
      merchantId: merchant.id,
      plan: plan,
      customerId: customer.id,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 