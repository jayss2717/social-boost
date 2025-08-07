import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting scheduled subscription sync...');

    // Get all merchants with subscriptions
    const merchants = await prisma.merchant.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    const results = {
      total: merchants.length,
      verified: 0,
      updated: 0,
      created: 0,
      errors: 0,
      details: [] as Array<{
        shop: string;
        action: string;
        message: string;
      }>,
    };

    for (const merchant of merchants) {
      try {
        // If no subscription exists, create default Starter
        if (!merchant.subscription) {
              const starterPlan = await prisma.plan.findUnique({
      where: { name: 'Starter' },
    });

          if (starterPlan) {
            await prisma.subscription.create({
              data: {
                merchantId: merchant.id,
                planId: starterPlan.id,
                status: 'ACTIVE',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });

            results.created++;
            results.details.push({
              shop: merchant.shop,
              action: 'created_starter',
              message: 'Created default Starter subscription',
            });
          }
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

          results.updated++;
          results.details.push({
            shop: merchant.shop,
            action: 'expired',
            message: 'Subscription expired, marked as canceled',
          });
          continue;
        }

        // If subscription has Stripe ID, verify with Stripe
        if (merchant.subscription.stripeSubId && stripe) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(
              merchant.subscription.stripeSubId
            );

            // Update if status differs
            if (stripeSubscription.status !== merchant.subscription.status.toLowerCase()) {
              await prisma.subscription.update({
                where: { id: merchant.subscription.id },
                data: {
                  status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'CANCELED',
                  currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                },
              });

              results.updated++;
              results.details.push({
                shop: merchant.shop,
                action: 'updated_status',
                message: `Updated from ${merchant.subscription.status} to ${stripeSubscription.status}`,
              });
            } else {
              results.verified++;
            }
          } catch (error) {
            console.error(`Error syncing ${merchant.shop}:`, error);
            
            // Mark as canceled if Stripe subscription not found
            await prisma.subscription.update({
              where: { id: merchant.subscription.id },
              data: {
                status: 'CANCELED',
                stripeSubId: null,
              },
            });

            results.updated++;
            results.details.push({
              shop: merchant.shop,
              action: 'marked_canceled',
              message: 'Stripe subscription not found, marked as canceled',
            });
          }
        } else {
          // No Stripe ID, just verify local subscription
          results.verified++;
        }
      } catch (error) {
        console.error(`Error processing ${merchant.shop}:`, error);
        results.errors++;
        results.details.push({
          shop: merchant.shop,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('✅ Scheduled subscription sync completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Scheduled subscription sync completed',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('❌ Scheduled subscription sync error:', error);
    return NextResponse.json({ error: 'Failed to sync subscriptions' }, { status: 500 });
  }
} 