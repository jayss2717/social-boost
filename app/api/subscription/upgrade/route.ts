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
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.HOST}/billing?success=true&shop=${shop}`,
      cancel_url: `${process.env.HOST}/billing?canceled=true&shop=${shop}`,
      metadata: {
        merchantId,
        plan,
        shop,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 