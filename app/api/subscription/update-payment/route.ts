import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Update Payment API: Starting request...');
    
    const body = await request.json();
    const { merchantId } = body;

    console.log('🔄 Update Payment API: Merchant ID received:', merchantId);

    if (!merchantId) {
      console.error('❌ Update Payment API: No merchant ID provided');
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

    console.log('🔄 Update Payment API: Merchant found:', merchant ? 'Yes' : 'No');
    console.log('🔄 Update Payment API: Merchant shop:', merchant?.shop);
    console.log('🔄 Update Payment API: Subscription status:', merchant?.subscription?.status);

    if (!merchant) {
      console.error('❌ Update Payment API: Merchant not found');
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.subscription) {
      console.error('❌ Update Payment API: No subscription found');
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    console.log('🔄 Update Payment API: Stripe configured:', !!stripe);
    console.log('🔄 Update Payment API: Stripe subscription ID:', merchant.subscription.stripeSubId);

    // Create a Stripe billing portal session for payment method updates
    if (stripe && merchant.subscription.stripeSubId) {
      console.log('🔄 Update Payment API: Looking for Stripe customer...');
      
      // Try to find Stripe customer by shop domain
      const customers = await stripe.customers.list({
        limit: 100,
      });
      
      const customer = customers.data.find(c => 
        c.metadata?.shop === merchant.shop || 
        c.email === merchant.shopEmail
      );

      console.log('🔄 Update Payment API: Stripe customer found:', !!customer);
      console.log('🔄 Update Payment API: Customer ID:', customer?.id);

      if (customer) {
        console.log('🔄 Update Payment API: Creating billing portal session...');
        
        const session = await stripe.billingPortal.sessions.create({
          customer: customer.id,
          return_url: `${process.env.HOST}/settings?shop=${merchant.shop}`,
        });

        console.log('🔄 Update Payment API: Billing portal session created:', session.url);

        return NextResponse.json({
          success: true,
          url: session.url,
          message: 'Redirecting to payment update...',
        });
      }
    }

    // If no Stripe subscription, create a checkout session for new payment method
    if (stripe) {
      console.log('🔄 Update Payment API: Creating checkout session for new payment method...');
      
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

      console.log('🔄 Update Payment API: Checkout session created:', session.url);

      return NextResponse.json({
        success: true,
        url: session.url,
        message: 'Redirecting to payment setup...',
      });
    }

    console.error('❌ Update Payment API: Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  } catch (error) {
    console.error('❌ Update Payment API: Error:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
} 