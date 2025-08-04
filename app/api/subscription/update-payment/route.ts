import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Find the merchant and their subscription
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Create a Stripe billing portal session for payment method updates
    if (stripe && merchant.subscription.stripeSubId) {
      // Try to find Stripe customer by shop domain
      const customers = await stripe.customers.list({
        limit: 100,
      });
      
      const customer = customers.data.find(c => 
        c.metadata?.shop === merchant.shop || 
        c.email === merchant.shopEmail
      );

      if (customer) {
        const session = await stripe.billingPortal.sessions.create({
          customer: customer.id,
          return_url: `${process.env.HOST}/settings?shop=${merchant.shop}`,
        });

        return NextResponse.json({
          success: true,
          url: session.url,
          message: 'Redirecting to payment update...',
        });
      }
    }

    // If no Stripe subscription, create a checkout session for new payment method
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'setup',
        success_url: `${process.env.HOST}/settings?success=payment_updated&shop=${merchant.shop}`,
        cancel_url: `${process.env.HOST}/settings?cancel=payment_update&shop=${merchant.shop}`,
        customer_email: merchant.shopEmail || undefined,
        metadata: {
          merchantId: merchant.id,
          action: 'payment_update',
        },
      });

      return NextResponse.json({
        success: true,
        url: session.url,
        message: 'Redirecting to payment setup...',
      });
    }

    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
} 