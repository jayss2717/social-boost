import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🔍 Checking webhook configuration for ${shop}`);

    const result: {
      success: boolean;
      message: string;
      stripe: {
        configured: boolean;
        apiKey: string | null;
        webhookSecret: string | null;
      };
      webhook: {
        endpoint: string;
        secret: string | null;
        events: string[];
      };
      customer: {
        exists: boolean;
        id: string | null;
        metadata: Record<string, unknown> | null;
      };
      recommendations: string[];
    } = {
      success: true,
      message: 'Webhook configuration check completed',
      stripe: {
        configured: !!stripe,
        apiKey: process.env.STRIPE_SECRET_KEY ? 'configured' : null,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : null,
      },
      webhook: {
        endpoint: `${process.env.HOST || 'https://socialboost-blue.vercel.app'}/api/subscription/webhook`,
        secret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : null,
        events: ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.payment_succeeded', 'invoice.payment_failed'],
      },
      customer: {
        exists: false,
        id: null,
        metadata: null,
      },
      recommendations: [],
    };

    // Check if Stripe is configured
    if (!stripe) {
      result.recommendations.push('Stripe is not configured - check STRIPE_SECRET_KEY');
      return NextResponse.json(result);
    }

    // Check webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      result.recommendations.push('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // Check if customer exists in Stripe
    try {
      const customers = await stripe.customers.list({
        limit: 100,
      });
      
      const customer = customers.data.find(c => c.metadata?.shop === shop);
      
      if (customer) {
        result.customer.exists = true;
        result.customer.id = customer.id;
        result.customer.metadata = customer.metadata;
        console.log('✅ Stripe customer found:', {
          id: customer.id,
          metadata: customer.metadata,
        });
      } else {
        result.recommendations.push('No Stripe customer found for this shop');
      }
    } catch (error) {
      console.error('Error checking Stripe customers:', error);
      result.recommendations.push('Error accessing Stripe customers');
    }

    // Check merchant in database
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (merchant) {
      console.log('✅ Merchant found in database:', {
        shop: merchant.shop,
        plan: merchant.subscription?.plan?.name,
        status: merchant.subscription?.status,
      });
    } else {
      result.recommendations.push('Merchant not found in database');
    }

    // Check if webhook endpoint is accessible
    try {
      const webhookResponse = await fetch('https://socialboost-blue.vercel.app/api/subscription/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'webhook' }),
      });
      
      if (webhookResponse.status === 400) {
        console.log('✅ Webhook endpoint is accessible (returned expected 400 for missing signature)');
      } else {
        result.recommendations.push(`Webhook endpoint returned unexpected status: ${webhookResponse.status}`);
      }
    } catch (error) {
      result.recommendations.push('Webhook endpoint is not accessible');
    }

    console.log('🔍 Webhook configuration check results:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Webhook configuration check error:', error);
    return NextResponse.json(
      { error: 'Failed to check webhook configuration' },
      { status: 500 }
    );
  }
} 