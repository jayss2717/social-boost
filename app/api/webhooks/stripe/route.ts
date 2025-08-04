import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!stripe || !signature) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Extract merchant ID and plan from metadata
        const merchantId = session.metadata?.merchantId;
        const plan = session.metadata?.plan;
        
        if (merchantId && plan) {
          console.log('Processing completed checkout for merchant:', merchantId, 'plan:', plan);
          
          // Update merchant onboarding status
          await prisma.merchant.update({
            where: { id: merchantId },
            data: {
              onboardingCompleted: true,
              onboardingStep: 5,
            },
          });
          
          console.log('Merchant onboarding completed after payment:', merchantId);
        }
        break;
        
      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id);
        break;
        
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
} 