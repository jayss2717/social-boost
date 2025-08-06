import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'storev101.myshopify.com';

    console.log(`🔧 Creating Stripe customer for ${shop}`);

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Extract store name
    const storeName = shop.replace('.myshopify.com', '');

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      limit: 100,
    });
    
    let customer = existingCustomers.data.find(c => c.metadata?.shop === shop);
    
    if (customer) {
      console.log('✅ Customer already exists:', {
        id: customer.id,
        metadata: customer.metadata,
      });
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: merchant.shopEmail || `${storeName}@example.com`,
        metadata: {
          shop,
          merchantId: merchant.id,
        },
        name: merchant.shopName || storeName,
      });
      console.log('✅ Created new Stripe customer:', {
        id: customer.id,
        metadata: customer.metadata,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe customer created/verified successfully',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata,
      },
    });
  } catch (error) {
    console.error('❌ Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe customer' },
      { status: 500 }
    );
  }
} 