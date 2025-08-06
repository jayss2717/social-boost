import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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

    console.log(`Webhook: Processing ${event.type} event for ${event.id}`);

    // Process the event asynchronously to avoid timeouts
    processWebhookEvent(event).catch(error => {
      console.error('❌ Async webhook processing error:', error);
    });

    // Return immediately to prevent timeout
    const responseTime = Date.now() - startTime;
    console.log(`✅ Webhook response sent in ${responseTime}ms`);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    const responseTime = Date.now() - startTime;
    console.log(`❌ Webhook error response in ${responseTime}ms`);
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(event: Stripe.Event) {
  const startTime = Date.now();
  
  try {
    // Ensure stripe is available in the async function
    if (!stripe) {
      console.error('Stripe not available in async processing');
      return;
    }

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
                // Common variations
                'Pro Plan': 'Pro',
                'Pro': 'Pro',
                'Professional': 'Pro',
                'Professional Plan': 'Pro',
                'Scale Plan': 'Scale',
                'Scale': 'Scale',
                'Enterprise Plan': 'ENTERPRISE',
                'Enterprise': 'ENTERPRISE',
                'Starter Plan': 'STARTER',
                'Starter': 'STARTER',
                'Free Plan': 'STARTER',
                'Free': 'STARTER',
                // Handle case-insensitive matching
                'pro': 'Pro',
                'scale': 'Scale',
                'enterprise': 'ENTERPRISE',
                'starter': 'STARTER',
                'free': 'STARTER',
              };
              
              // Try exact match first, then case-insensitive
              let mappedPlanName = planNameMapping[planName];
              if (!mappedPlanName) {
                // Try case-insensitive matching
                const lowerPlanName = planName.toLowerCase();
                mappedPlanName = planNameMapping[lowerPlanName];
              }
              
              // If still no match, try to extract plan name from product name
              if (!mappedPlanName) {
                if (planName.toLowerCase().includes('pro')) {
                  mappedPlanName = 'Pro';
                } else if (planName.toLowerCase().includes('scale')) {
                  mappedPlanName = 'Scale';
                } else if (planName.toLowerCase().includes('enterprise')) {
                  mappedPlanName = 'ENTERPRISE';
                } else if (planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('free')) {
                  mappedPlanName = 'STARTER';
                }
              }
              
              console.log('Original Stripe product name:', planName);
              console.log('Mapped plan name:', mappedPlanName);
              
              const plan = await prisma.plan.findUnique({
                where: { name: mappedPlanName },
              });

              if (plan) {
                try {
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
                    console.log(`✅ Updated subscription for ${merchant.shop} to ${mappedPlanName} (Plan ID: ${plan.id})`);
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
                    console.log(`✅ Created new subscription for ${merchant.shop} with ${mappedPlanName} (Plan ID: ${plan.id})`);
                  }
                } catch (error) {
                  console.error(`❌ Failed to update/create subscription for ${merchant.shop}:`, error);
                  throw error;
                }
              } else {
                console.error(`❌ Plan not found for name: ${mappedPlanName}`);
                const availablePlans = await prisma.plan.findMany();
                console.error('Available plans:', availablePlans.map(p => ({ id: p.id, name: p.name })));
                
                // Try to create a fallback subscription with STARTER plan
                const fallbackPlan = await prisma.plan.findUnique({ where: { name: 'STARTER' } });
                if (fallbackPlan) {
                  console.log(`⚠️ Creating fallback subscription with STARTER plan for ${merchant.shop}`);
                  try {
                    if (merchant.subscription) {
                      await prisma.subscription.update({
                        where: { id: merchant.subscription.id },
                        data: {
                          planId: fallbackPlan.id,
                          status: 'ACTIVE',
                          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                          stripeSubId: subscription.id,
                        },
                      });
                    } else {
                      await prisma.subscription.create({
                        data: {
                          merchantId: merchant.id,
                          planId: fallbackPlan.id,
                          status: 'ACTIVE',
                          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                          stripeSubId: subscription.id,
                        },
                      });
                    }
                    console.log(`✅ Created fallback subscription with STARTER plan for ${merchant.shop}`);
                  } catch (fallbackError) {
                    console.error(`❌ Failed to create fallback subscription:`, fallbackError);
                  }
                }
              }
            } else {
              console.error(`❌ Merchant not found for shop: ${shop}`);
            }
          } else {
            console.error('❌ No shop found in customer metadata');
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
              'Enterprise Plan': 'ENTERPRISE',
              'Enterprise': 'ENTERPRISE',
              'Starter Plan': 'STARTER',
              'Starter': 'STARTER',
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
              console.log(`✅ Updated subscription for ${merchant.shop} to ${mappedPlanName}`);
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
            console.log(`✅ Canceled subscription for ${merchant.shop}`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
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
                // Common variations
                'Pro Plan': 'Pro',
                'Pro': 'Pro',
                'Professional': 'Pro',
                'Professional Plan': 'Pro',
                'Scale Plan': 'Scale',
                'Scale': 'Scale',
                'Enterprise Plan': 'ENTERPRISE',
                'Enterprise': 'ENTERPRISE',
                'Starter Plan': 'STARTER',
                'Starter': 'STARTER',
                'Free Plan': 'STARTER',
                'Free': 'STARTER',
                // Handle case-insensitive matching
                'pro': 'Pro',
                'scale': 'Scale',
                'enterprise': 'ENTERPRISE',
                'starter': 'STARTER',
                'free': 'STARTER',
              };
              
              // Try exact match first, then case-insensitive
              let mappedPlanName = planNameMapping[planName];
              if (!mappedPlanName) {
                // Try case-insensitive matching
                const lowerPlanName = planName.toLowerCase();
                mappedPlanName = planNameMapping[lowerPlanName];
              }
              
              // If still no match, try to extract plan name from product name
              if (!mappedPlanName) {
                if (planName.toLowerCase().includes('pro')) {
                  mappedPlanName = 'Pro';
                } else if (planName.toLowerCase().includes('scale')) {
                  mappedPlanName = 'Scale';
                } else if (planName.toLowerCase().includes('enterprise')) {
                  mappedPlanName = 'ENTERPRISE';
                } else if (planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('free')) {
                  mappedPlanName = 'STARTER';
                }
              }
              
              console.log('Original Stripe product name:', planName);
              console.log('Mapped plan name:', mappedPlanName);
              
              const plan = await prisma.plan.findUnique({
                where: { name: mappedPlanName },
              });

              if (plan) {
                await prisma.subscription.update({
                  where: { id: merchant.subscription.id },
                  data: {
                    planId: plan.id,
                    status: 'ACTIVE',
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    stripeSubId: subscription.id,
                  },
                });
                console.log(`✅ Updated subscription for ${merchant.shop} to ${mappedPlanName} after payment`);
              }
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
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
                  status: 'PAST_DUE',
                },
              });
              console.log(`⚠️ Marked subscription as past due for ${merchant.shop} after failed payment`);
            }
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook event processed in ${processingTime}ms`);
  } catch (error) {
    console.error('❌ Async webhook processing error:', error);
    const processingTime = Date.now() - startTime;
    console.log(`❌ Webhook processing failed in ${processingTime}ms`);
  }
} 