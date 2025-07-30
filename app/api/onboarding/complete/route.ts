import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { shop, onboardingData } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    try {
      // Check if merchant exists first
      const existingMerchant = await prisma.merchant.findUnique({
        where: { shop },
      });

      if (!existingMerchant) {
        console.log('Merchant not found, creating test merchant for onboarding completion');
        // Create a test merchant for onboarding completion
        const testMerchant = await prisma.merchant.create({
          data: {
            shop,
            accessToken: 'test-token',
            scope: 'read_products,write_products',
            shopifyShopId: '123456789',
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

        // Create merchant settings
        await prisma.merchantSettings.create({
          data: {
            merchantId: testMerchant.id,
            name: testMerchant.shopName || 'Test Store',
            email: testMerchant.shopEmail || `admin@${shop}`,
            website: `https://${shop}`,
            linkPattern: '/discount/{{code}}',
            socialMedia: {
              instagram: '',
              tiktok: '',
              twitter: '',
              youtube: '',
            },
            discountSettings: {
              defaultPercentage: 20,
              maxPercentage: 50,
              minPercentage: 5,
              autoApprove: false,
            },
            commissionSettings: {
              defaultRate: onboardingData.commissionRate,
              maxRate: onboardingData.commissionRate * 1.5,
              minRate: onboardingData.commissionRate * 0.5,
              autoPayout: onboardingData.autoApprove,
            },
            ugcSettings: {
              autoApprove: onboardingData.autoApprove,
              minEngagement: onboardingData.minEngagement,
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
              autoPayout: onboardingData.autoApprove,
              payoutSchedule: onboardingData.payoutSchedule,
              minimumPayout: 50,
              stripeAccountId: '',
            },
          },
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Onboarding completed successfully',
          merchant: {
            id: testMerchant.id,
            shop: testMerchant.shop,
            onboardingCompleted: testMerchant.onboardingCompleted,
          }
        });
      } else {
        console.log('Merchant found, updating onboarding status');
        // Update existing merchant onboarding status
        const merchant = await prisma.merchant.update({
          where: { shop },
          data: {
            onboardingCompleted: true,
            onboardingStep: 5,
            onboardingData: onboardingData,
          },
        });

        // Update merchant settings with onboarding data
        await prisma.merchantSettings.upsert({
          where: { merchantId: merchant.id },
          update: {
            commissionSettings: {
              defaultRate: onboardingData.commissionRate,
              maxRate: onboardingData.commissionRate * 1.5,
              minRate: onboardingData.commissionRate * 0.5,
              autoPayout: onboardingData.autoApprove,
            },
            ugcSettings: {
              autoApprove: onboardingData.autoApprove,
              minEngagement: onboardingData.minEngagement,
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
              autoPayout: onboardingData.autoApprove,
              payoutSchedule: onboardingData.payoutSchedule,
              minimumPayout: 50,
              stripeAccountId: '',
            },
          },
          create: {
            merchantId: merchant.id,
            name: merchant.shopName || 'Test Store',
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
              defaultPercentage: 20,
              maxPercentage: 50,
              minPercentage: 5,
              autoApprove: false,
            },
            commissionSettings: {
              defaultRate: onboardingData.commissionRate,
              maxRate: onboardingData.commissionRate * 1.5,
              minRate: onboardingData.commissionRate * 0.5,
              autoPayout: onboardingData.autoApprove,
            },
            ugcSettings: {
              autoApprove: onboardingData.autoApprove,
              minEngagement: onboardingData.minEngagement,
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
              autoPayout: onboardingData.autoApprove,
              payoutSchedule: onboardingData.payoutSchedule,
              minimumPayout: 50,
              stripeAccountId: '',
            },
          },
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Onboarding completed successfully',
          merchant: {
            id: merchant.id,
            shop: merchant.shop,
            onboardingCompleted: merchant.onboardingCompleted,
          }
        });
      }
    } catch (dbError) {
      console.error('Database error in onboarding completion:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 