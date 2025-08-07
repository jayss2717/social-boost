import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Stripe } from 'stripe';

export async function POST() {
  try {
    console.log('Starting bulk subscription sync...');
    
    // Get all merchants
    const merchants = await prisma.merchant.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    console.log(`Found ${merchants.length} merchants to sync`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const merchant of merchants) {
      try {
            // Create Starter plan if it doesn't exist
    const starterPlan = await prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        priceCents: 0,
        ugcLimit: 5,
        influencerLimit: 1,
      },
    });

        // If merchant has no subscription, create a Starter subscription
        if (!merchant.subscription) {
          await prisma.subscription.create({
            data: {
              merchantId: merchant.id,
              planId: starterPlan.id,
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
          console.log(`Created Starter subscription for merchant ${merchant.id}`);
          updatedCount++;
          continue;
        }

        // Check if subscription is expired
        if (merchant.subscription.currentPeriodEnd < new Date()) {
          await prisma.subscription.update({
            where: { id: merchant.subscription.id },
            data: {
              status: 'CANCELED',
            },
          });
          console.log(`Marked subscription as expired for merchant ${merchant.id}`);
          updatedCount++;
        }

        // For paid plans, sync with Stripe
        if (merchant.subscription.plan.name !== 'Starter') {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
              apiVersion: '2023-10-16',
            });

            // Get customer from Stripe using shop domain
            const customers = await stripe.customers.list({
              limit: 100,
            });

            const customer = customers.data.find(c => 
              c.metadata?.shop === merchant.shop || 
              c.email === merchant.shop
            );

            if (customer) {
              const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
              });

              if (subscriptions.data.length > 0) {
                const stripeSubscription = subscriptions.data[0];
                const product = await stripe.products.retrieve(stripeSubscription.items.data[0].price.product as string);
                
                // Update subscription based on Stripe data
                const planName = product.name;
                const plan = await prisma.plan.findUnique({
                  where: { name: planName },
                });

                if (plan) {
                  await prisma.subscription.update({
                    where: { id: merchant.subscription.id },
                    data: {
                      planId: plan.id,
                      status: 'ACTIVE',
                      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                    },
                  });
                  console.log(`Synced subscription for merchant ${merchant.id} with Stripe`);
                  updatedCount++;
                }
              }
            }
          } catch (stripeError) {
            console.error(`Stripe sync error for merchant ${merchant.id}:`, stripeError);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing merchant ${merchant.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Sync completed. Updated: ${updatedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Sync completed. Updated: ${updatedCount}, Errors: ${errorCount}`,
      updatedCount,
      errorCount,
    });
  } catch (error) {
    console.error('Bulk sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync subscriptions' },
      { status: 500 }
    );
  }
} 