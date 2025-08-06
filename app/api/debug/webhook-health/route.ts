import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Running comprehensive webhook health check...');

    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      checks: {
        stripe: false,
        database: false,
        webhookSecret: false,
        plans: false,
        merchants: false,
        subscriptions: false,
      },
      details: {
        stripeConfigured: !!stripe,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
        databaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      errors: [],
    };

    // Check Stripe configuration
    try {
      if (stripe) {
        const account = await stripe.accounts.retrieve();
        healthCheck.checks.stripe = true;
        healthCheck.details.stripeAccount = account.id;
      } else {
        healthCheck.errors.push('Stripe not configured');
      }
    } catch (error) {
      healthCheck.errors.push(`Stripe error: ${error}`);
    }

    // Check database connection
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      healthCheck.checks.database = true;
      healthCheck.details.databaseTest = result;
    } catch (error) {
      healthCheck.errors.push(`Database error: ${error}`);
    }

    // Check webhook secret
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      healthCheck.checks.webhookSecret = true;
    } else {
      healthCheck.errors.push('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Check plans
    try {
      const plans = await prisma.plan.findMany();
      healthCheck.checks.plans = true;
      healthCheck.details.plans = plans.map(p => ({ id: p.id, name: p.name }));
    } catch (error) {
      healthCheck.errors.push(`Plans error: ${error}`);
    }

    // Check merchants
    try {
      const merchants = await prisma.merchant.findMany({
        include: { subscription: { include: { plan: true } } },
      });
      healthCheck.checks.merchants = true;
      healthCheck.details.merchants = merchants.map(m => ({
        id: m.id,
        shop: m.shop,
        hasSubscription: !!m.subscription,
        plan: m.subscription?.plan?.name,
      }));
    } catch (error) {
      healthCheck.errors.push(`Merchants error: ${error}`);
    }

    // Check subscriptions
    try {
      const subscriptions = await prisma.subscription.findMany({
        include: { plan: true, merchant: true },
      });
      healthCheck.checks.subscriptions = true;
      healthCheck.details.subscriptions = subscriptions.map(s => ({
        id: s.id,
        merchantId: s.merchantId,
        plan: s.plan.name,
        status: s.status,
        stripeSubId: s.stripeSubId,
      }));
    } catch (error) {
      healthCheck.errors.push(`Subscriptions error: ${error}`);
    }

    // Overall status
    const allChecksPassed = Object.values(healthCheck.checks).every(check => check === true);
    healthCheck.status = allChecksPassed ? 'healthy' : 'unhealthy';

    console.log('✅ Webhook health check completed:', healthCheck.status);
    console.log('📊 Health check details:', healthCheck);

    return NextResponse.json(healthCheck);

  } catch (error) {
    console.error('❌ Webhook health check failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 