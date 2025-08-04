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
    const standaloneAppUrl = process.env.HOST || 'https://socialboost-blue.vercel.app';
    
    // Create or find customer with proper metadata
    let customer;
    const existingCustomers = await stripe.customers.list({
      limit: 100,
    });
    
    customer = existingCustomers.data.find(c => c.metadata?.shop === shop);
    
    if (!customer) {
      customer = await stripe.customers.create({
        email: merchant.shopEmail || `${storeName}@example.com`,
        metadata: {
          shop,
          merchantId,
        },
        name: merchant.shopName || storeName,
      });
      console.log(`Created new Stripe customer for ${shop}`);
    } else {
      // Update existing customer metadata if needed
      if (customer.metadata?.shop !== shop) {
        customer = await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            shop,
            merchantId,
          },
        });
        console.log(`Updated Stripe customer metadata for ${shop}`);
      }
    }
    
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
      cancel_url: `${shopifyAppUrl}`,
      metadata: {
        merchantId,
        plan,
        shop,
      },
    });

    console.log(`Created checkout session for ${shop} to upgrade to ${plan}`);
    console.log(`Success URL: ${shopifyAppUrl}?payment_success=true&plan=${plan}`);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 