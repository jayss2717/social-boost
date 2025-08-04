import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';

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
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        
        if (session.mode === 'subscription' && session.customer) {
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
          const shop = customer.metadata?.shop;
          
          console.log('Customer metadata:', customer.metadata);
          console.log('Shop from metadata:', shop);
          
          if (shop) {
            const merchant = await prisma.merchant.findUnique({
              where: { shop },
              include: { subscription: true }
            });

            if (merchant) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
              const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
              const planName = product.name;
              
              console.log('Stripe product name:', planName);
              
              // Map Stripe product names to database plan names
              const planNameMapping: { [key: string]: string } = {
                'Pro Plan': 'Pro',
                'Pro': 'Pro',
                'Scale Plan': 'Scale',
                'Scale': 'Scale',
                'Enterprise Plan': 'Enterprise',
                'Enterprise': 'Enterprise',
                'Starter Plan': 'Starter',
                'Starter': 'Starter',
              };
              
              const mappedPlanName = planNameMapping[planName] || planName;
              console.log('Mapped plan name:', mappedPlanName);
              
              const plan = await prisma.plan.findUnique({
                where: { name: mappedPlanName },
              });

              if (plan) {
                if (merchant.subscription) {
                  // Update existing subscription
                  await prisma.subscription.update({
                    where: { id: merchant.subscription.id },
                    data: {
                      planId: plan.id,
                      status: 'ACTIVE',
                      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                      stripeSubId: subscription.id,
                    },
                  });
                  console.log(`Updated subscription for ${merchant.shop} to ${mappedPlanName}`);
                } else {
                  // Create new subscription
                  await prisma.subscription.create({
                    data: {
                      merchantId: merchant.id,
                      planId: plan.id,
                      status: 'ACTIVE',
                      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                      stripeSubId: subscription.id,
                    },
                  });
                  console.log(`Created new subscription for ${merchant.shop} with ${mappedPlanName}`);
                }
              } else {
                console.error(`Plan not found for name: ${mappedPlanName}`);
                console.error('Available plans:', await prisma.plan.findMany());
              }
            } else {
              console.error(`Merchant not found for shop: ${shop}`);
            }
          } else {
            console.error('No shop found in customer metadata');
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        
        // Find merchant by Stripe customer ID
        const customers = await stripe.customers.list({
          limit: 100,
        });
        
        const customer = customers.data.find(c => c.id === subscription.customer);
        if (customer && customer.metadata?.shop) {
          const merchant = await prisma.merchant.findUnique({
            where: { shop: customer.metadata.shop },
            include: { subscription: true },
          });

          if (merchant && merchant.subscription) {
            const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
            const planName = product.name;
            
            // Map Stripe product names to database plan names
            const planNameMapping: { [key: string]: string } = {
              'Pro Plan': 'Pro',
              'Pro': 'Pro',
              'Scale Plan': 'Scale',
              'Scale': 'Scale',
              'Enterprise Plan': 'Enterprise',
              'Enterprise': 'Enterprise',
              'Starter Plan': 'Starter',
              'Starter': 'Starter',
            };
            
            const mappedPlanName = planNameMapping[planName] || planName;
            
            const plan = await prisma.plan.findUnique({
              where: { name: mappedPlanName },
            });

            if (plan) {
              await prisma.subscription.update({
                where: { id: merchant.subscription.id },
                data: {
                  planId: plan.id,
                  status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELED',
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  stripeSubId: subscription.id,
                },
              });
              console.log(`Updated subscription for ${merchant.shop} to ${mappedPlanName}`);
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        
        // Find merchant by Stripe customer ID
        const customers = await stripe.customers.list({
          limit: 100,
        });
        
        const customer = customers.data.find(c => c.id === subscription.customer);
        if (customer && customer.metadata?.shop) {
          const merchant = await prisma.merchant.findUnique({
            where: { shop: customer.metadata.shop },
            include: { subscription: true },
          });

          if (merchant && merchant.subscription) {
            await prisma.subscription.update({
              where: { id: merchant.subscription.id },
              data: {
                status: 'CANCELED',
                stripeSubId: null,
              },
            });
            console.log(`Canceled subscription for ${merchant.shop}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 