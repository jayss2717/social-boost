import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      console.error('Stripe not configured for webhook');
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Webhook: No signature provided');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook: Invalid signature', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Webhook: Processing ${event.type} event`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const metadata = session.metadata || {};
        const merchantId = metadata.merchantId;
        const plan = metadata.plan;

        console.log(`Webhook: Checkout completed for merchant ${merchantId}, plan ${plan}`);

        if (!merchantId || !plan) {
          console.error('Webhook: Missing merchantId or plan in metadata', { merchantId, plan });
          return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
        }

        // Verify merchant exists
        const merchant = await prisma.merchant.findUnique({
          where: { id: merchantId },
        });

        if (!merchant) {
          console.error(`Webhook: Merchant ${merchantId} not found`);
          return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
        }

        const planMap = {
          Pro: { ugcLimit: 300, influencerLimit: 10 },
          Scale: { ugcLimit: 1000, influencerLimit: 50 },
          Enterprise: { ugcLimit: -1, influencerLimit: -1 }, // -1 means unlimited
        };

        const planData = planMap[plan as keyof typeof planMap];
        if (!planData) {
          console.error(`Webhook: Unknown plan ${plan}`);
          return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
        }

        // Find or create the plan
        let planRecord = await prisma.plan.findUnique({
          where: { name: plan },
        });

        if (!planRecord) {
          console.log(`Webhook: Creating new plan ${plan}`);
          planRecord = await prisma.plan.create({
            data: {
              name: plan,
              priceCents: plan === 'Pro' ? 2999 : plan === 'Scale' ? 6999 : 0,
              ugcLimit: planData.ugcLimit,
              influencerLimit: planData.influencerLimit,
            },
          });
        }

        // Create or update subscription
        const subscription = await prisma.subscription.upsert({
          where: { merchantId },
          update: {
            planId: planRecord.id,
            stripeSubId: session.subscription || null,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          create: {
            merchantId,
            planId: planRecord.id,
            stripeSubId: session.subscription || null,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        console.log(`Webhook: Successfully updated subscription for merchant ${merchantId} to plan ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log(`Webhook: Subscription updated ${subscription.id}`);
        
        await prisma.subscription.updateMany({
          where: { stripeSubId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELED',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log(`Webhook: Subscription deleted ${subscription.id}`);
        
        await prisma.subscription.updateMany({
          where: { stripeSubId: subscription.id },
          data: {
            status: 'CANCELED',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log(`Webhook: Payment succeeded for subscription ${invoice.subscription}`);
        
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubId: invoice.subscription },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: new Date(invoice.period_end * 1000),
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log(`Webhook: Payment failed for subscription ${invoice.subscription}`);
        
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubId: invoice.subscription },
            data: {
              status: 'PAST_DUE',
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
} 