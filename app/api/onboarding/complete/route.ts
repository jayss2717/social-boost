import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Onboarding completion API called');
    const { shop, onboardingData } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('Processing onboarding for shop:', shop);
    console.log('Onboarding data:', onboardingData);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    try {
      // Create or update merchant with onboarding data
      const merchant = await prisma.merchant.upsert({
        where: { shop },
        update: {
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: onboardingData,
          // Don't override OAuth credentials if they exist
        },
        create: {
          shop,
          accessToken: 'pending',
          scope: 'read_products,write_products',
          shopifyShopId: null, // Will be updated during OAuth
          shopName: shop.replace('.myshopify.com', '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          shopEmail: `admin@${shop}`,
          shopDomain: shop,
          shopCurrency: 'USD',
          shopTimezone: 'UTC',
          shopLocale: 'en',
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: onboardingData,
        },
      });

      console.log('Merchant created/updated successfully:', merchant.id);

      // 🆕 CREATE SUBSCRIPTION BASED ON SELECTED PLAN
      const selectedPlan = onboardingData?.selectedPlan || 'STARTER';
      console.log('Selected plan during onboarding:', selectedPlan);

      // Get the plan from database
      const plan = await prisma.plan.findUnique({
        where: { name: selectedPlan },
      });

      if (plan) {
        console.log('Plan found:', { id: plan.id, name: plan.name, limits: { ugc: plan.ugcLimit, influencers: plan.influencerLimit } });

        // Create or update subscription
        const subscription = await prisma.subscription.upsert({
          where: { merchantId: merchant.id },
          update: {
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            updatedAt: new Date(),
          },
          create: {
            merchantId: merchant.id,
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            stripeSubId: null, // Will be updated when payment is processed
          },
        });

        console.log('Subscription created/updated:', {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        });
      } else {
        console.error('Plan not found for:', selectedPlan);
        // Fallback to STARTER plan
        const starterPlan = await prisma.plan.findUnique({
          where: { name: 'STARTER' },
        });

        if (starterPlan) {
          await prisma.subscription.upsert({
            where: { merchantId: merchant.id },
            update: {
              planId: starterPlan.id,
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            },
            create: {
              merchantId: merchant.id,
              planId: starterPlan.id,
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              stripeSubId: null,
            },
          });
          console.log('Created fallback STARTER subscription');
        }
      }

      // Sync onboarding data to MerchantSettings
      try {
        const settingsData = {
          name: merchant.shopName || shop.replace('.myshopify.com', ''),
          email: merchant.shopEmail || `admin@${shop}`,
          website: `https://${shop}`,
          linkPattern: '/discount/{{code}}',
          socialMedia: {
            instagram: '',
            tiktok: '',
            twitter: '',
            youtube: '',
          },
          discountSettings: {
            defaultPercentage: onboardingData?.commissionRate || 20,
            maxPercentage: 50,
            minPercentage: 5,
            autoApprove: onboardingData?.autoApprove || false,
          },
          commissionSettings: {
            defaultRate: onboardingData?.commissionRate || 10,
            maxRate: 25,
            minRate: 5,
            autoPayout: false,
          },
          ugcSettings: {
            autoApprove: onboardingData?.autoApprove || false,
            minEngagement: onboardingData?.minEngagement || 100,
            requiredHashtags: [],
            excludedWords: [],
            codeDelayHours: 2,
            codeDelayMinutes: 0,
            maxCodesPerDay: 50,
            maxCodesPerInfluencer: 1,
            discountType: 'PERCENTAGE',
            discountValue: 20,
            discountUsageLimit: 100,
          },
          payoutSettings: {
            autoPayout: false,
            payoutSchedule: onboardingData?.payoutSchedule || 'WEEKLY',
            minimumPayout: 50,
          },
        };

        await prisma.merchantSettings.upsert({
          where: { merchantId: merchant.id },
          update: settingsData,
          create: {
            merchantId: merchant.id,
            ...settingsData,
          },
        });

        console.log('MerchantSettings synced successfully');
      } catch (settingsError) {
        console.error('Failed to sync MerchantSettings:', settingsError);
        // Don't fail the onboarding completion if settings sync fails
      }

      return NextResponse.json({
        success: true,
        message: 'Onboarding completed successfully',
        merchant: {
          id: merchant.id,
          shop: merchant.shop,
          onboardingCompleted: merchant.onboardingCompleted,
        },
        subscription: {
          plan: selectedPlan,
        }
      });

    } catch (dbError) {
      console.error('Database error in onboarding completion:', dbError);

      // Try to provide more specific error information
      if (dbError instanceof Error) {
        console.error('Error name:', dbError.name);
        console.error('Error message:', dbError.message);
      }

      return NextResponse.json({ error: 'Database operation failed' }, { status: 503 });
    }
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 