import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🧪 Testing subscription flow for ${shop}`);

    // 1. Check current subscription status
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

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // 2. Check Stripe customer
    let stripeCustomer = null;
    if (stripe) {
      const customers = await stripe.customers.list({
        limit: 100,
      });
      
      stripeCustomer = customers.data.find(c => c.metadata?.shop === shop);
      
      if (stripeCustomer) {
        console.log('Stripe customer found:', {
          id: stripeCustomer.id,
          metadata: stripeCustomer.metadata,
        });
      } else {
        console.log('No Stripe customer found for shop');
      }
    }

    // 3. Check available plans
    const plans = await prisma.plan.findMany();
    const planNames = plans.map(p => p.name);

    // 4. Check Stripe products (if configured)
    let stripeProducts: Array<{ id: string; name: string }> = [];
    if (stripe) {
      try {
        const products = await stripe.products.list();
        stripeProducts = products.data.map(p => ({
          id: p.id,
          name: p.name,
        }));
      } catch (error) {
        console.error('Error fetching Stripe products:', error);
      }
    }

    const result: {
      success: boolean;
      message: string;
      currentStatus: {
        shop: string;
        plan: string | null;
        status: string | null;
        limits: {
          ugcLimit: number | null;
          influencerLimit: number | null;
        };
      };
      stripeCustomer: {
        id: string | null;
        metadata: Record<string, unknown> | null;
      };
      availablePlans: string[];
      stripeProducts: Array<{
        id: string;
        name: string;
      }>;
      recommendations: string[];
    } = {
      success: true,
      message: 'Subscription flow test completed',
      currentStatus: {
        shop,
        plan: merchant.subscription?.plan?.name || null,
        status: merchant.subscription?.status || null,
        limits: {
          ugcLimit: merchant.subscription?.plan?.ugcLimit || null,
          influencerLimit: merchant.subscription?.plan?.influencerLimit || null,
        },
      },
      stripeCustomer: stripeCustomer ? {
        id: stripeCustomer.id,
        metadata: stripeCustomer.metadata,
      } : {
        id: null,
        metadata: null,
      },
      availablePlans: planNames,
      stripeProducts,
      recommendations: [],
    };

    // 5. Generate recommendations
    if (!merchant.subscription) {
      result.recommendations.push('Create a default Starter subscription');
    }

    if (!stripeCustomer) {
      result.recommendations.push('Create Stripe customer with proper metadata');
    }

    if (stripeProducts && stripeProducts.length === 0) {
      result.recommendations.push('Create Stripe products for each plan');
    }

    console.log('🧪 Test results:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json(
      { error: 'Failed to test subscription flow' },
      { status: 500 }
    );
  }
} 