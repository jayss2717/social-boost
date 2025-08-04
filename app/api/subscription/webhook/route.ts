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
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as unknown as Record<string, unknown>;
        const metadata = session.metadata as Record<string, unknown>;
        const merchantId = metadata.merchantId as string;
        const plan = metadata.plan as string;

        const planMap = {
          Pro: { ugcLimit: 300, influencerLimit: 10 },
          Scale: { ugcLimit: 1000, influencerLimit: 50 }, // Match onboarding UI: "50 Influencers"
        };

        const planData = planMap[plan as keyof typeof planMap];
        if (!planData) break;

        // Create or update plan
        let planRecord = await prisma.plan.findUnique({
          where: { name: plan },
        });

        if (!planRecord) {
          planRecord = await prisma.plan.create({
            data: {
              name: plan,
              priceCents: plan === 'Pro' ? 2900 : 9900,
              ugcLimit: planData.ugcLimit,
              influencerLimit: planData.influencerLimit,
            },
          });
        }

        // Create or update subscription
        await prisma.subscription.upsert({
          where: { merchantId },
          update: {
            planId: planRecord.id,
            stripeSubId: session.subscription as string,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          create: {
            merchantId,
            planId: planRecord.id,
            stripeSubId: session.subscription as string,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        
        await prisma.subscription.updateMany({
          where: { stripeSubId: subscription.id as string },
          data: {
            status: (subscription.status as string) === 'active' ? 'ACTIVE' : 'CANCELED',
            currentPeriodEnd: new Date(Number(subscription.current_period_end) * 1000),
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
} 