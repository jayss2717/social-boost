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
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    try {
      // Create or update merchant with onboarding data
      const merchant = await prisma.merchant.upsert({
        where: { shop },
        update: {
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: onboardingData,
        },
        create: {
          shop,
          accessToken: 'pending',
          scope: 'read_products,write_products',
          shopifyShopId: `shop-${Date.now()}`,
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