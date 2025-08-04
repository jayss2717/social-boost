import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Find the merchant
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

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Try to find Stripe customer
    const customers = await stripe.customers.list({
      limit: 100,
    });
    
    const customer = customers.data.find(c => 
      c.metadata?.shop === merchant.shop || 
      c.email === merchant.shopEmail
    );

    if (!customer) {
      return NextResponse.json({ 
        success: true, 
        paymentMethod: null,
        message: 'No Stripe customer found' 
      });
    }

    // Get the default payment method
    if (customer.default_source) {
      const paymentMethod = await stripe.paymentMethods.retrieve(customer.default_source as string);
      
      return NextResponse.json({
        success: true,
        paymentMethod: {
          id: paymentMethod.id,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
        },
      });
    }

    // If no default payment method, try to get from payment methods list
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    if (paymentMethods.data.length > 0) {
      const paymentMethod = paymentMethods.data[0];
      
      return NextResponse.json({
        success: true,
        paymentMethod: {
          id: paymentMethod.id,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      paymentMethod: null,
      message: 'No payment method found' 
    });

  } catch (error) {
    console.error('Payment method fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment method' }, { status: 500 });
  }
} 