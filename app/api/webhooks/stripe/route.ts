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

      // Stripe Connect Account Events
      case 'account.updated':
        const account = event.data.object;
        console.log('Stripe Connect account updated:', account.id);
        
        // Update influencer's account status
        await prisma.influencer.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            updatedAt: new Date(),
          },
        });
        break;

      case 'account.application.authorized':
        const authorizedAccount = event.data.object;
        console.log('Stripe Connect account authorized:', authorizedAccount.id);
        break;

      case 'account.application.deauthorized':
        const deauthorizedAccount = event.data.object;
        console.log('Stripe Connect account deauthorized:', deauthorizedAccount.id);
        break;

      // Transfer Events (Payouts)
      case 'transfer.created':
        const transferCreated = event.data.object;
        console.log('Transfer created:', transferCreated.id);
        
        // Update payout status to PROCESSING
        await prisma.payout.updateMany({
          where: { stripeTransferId: transferCreated.id },
          data: {
            status: 'PROCESSING',
            updatedAt: new Date(),
          },
        });
        break;

      case 'transfer.paid':
        const transferPaid = event.data.object;
        console.log('Transfer paid:', transferPaid.id);
        
        // Update payout status to COMPLETED
        await prisma.payout.updateMany({
          where: { stripeTransferId: transferPaid.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;

      case 'transfer.failed':
        const transferFailed = event.data.object;
        console.log('Transfer failed:', transferFailed.id);
        
        // Update payout status to FAILED
        await prisma.payout.updateMany({
          where: { stripeTransferId: transferFailed.id },
          data: {
            status: 'FAILED',
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;

      case 'transfer.updated':
        const transferUpdated = event.data.object;
        console.log('Transfer updated:', transferUpdated.id);
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