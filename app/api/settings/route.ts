import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { settingsSchema, createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { SocialMediaSettings, DiscountSettings, CommissionSettings, UgcSettings, PayoutSettings } from '@/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    const settings = await prisma.merchantSettings.findUnique({
      where: { merchantId },
    });

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        id: null,
        merchantId,
        name: '',
        email: '',
        website: '',
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
          defaultRate: 10,
          maxRate: 25,
          minRate: 5,
          autoPayout: false,
        },
        ugcSettings: {
          autoApprove: false,
          minEngagement: 100,
          requiredHashtags: [],
          excludedWords: [],
        },
        payoutSettings: {
          autoPayout: false,
          payoutSchedule: 'WEEKLY',
          minimumPayout: 50,
        },
      };

      return createSuccessResponse(defaultSettings);
    }

          return createSuccessResponse({
        id: settings.id,
        merchantId: settings.merchantId,
        name: settings.name,
        email: settings.email,
        website: settings.website || '',
        linkPattern: settings.linkPattern || '/discount/{{code}}',
        socialMedia: settings.socialMedia as unknown as SocialMediaSettings,
        discountSettings: settings.discountSettings as unknown as DiscountSettings,
        commissionSettings: settings.commissionSettings as unknown as CommissionSettings,
        ugcSettings: settings.ugcSettings as unknown as UgcSettings,
        payoutSettings: settings.payoutSettings as unknown as PayoutSettings,
      });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return createErrorResponse('Failed to fetch settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    const settings = await prisma.merchantSettings.upsert({
      where: { merchantId },
      update: {
        name: validatedData.name,
        email: validatedData.email,
        website: validatedData.website,
        linkPattern: validatedData.linkPattern,
        socialMedia: validatedData.socialMedia,
        discountSettings: validatedData.discountSettings,
        commissionSettings: validatedData.commissionSettings,
        ugcSettings: validatedData.ugcSettings,
        payoutSettings: validatedData.payoutSettings,
      },
      create: {
        merchantId,
        name: validatedData.name,
        email: validatedData.email,
        website: validatedData.website,
        linkPattern: validatedData.linkPattern,
        socialMedia: validatedData.socialMedia,
        discountSettings: validatedData.discountSettings,
        commissionSettings: validatedData.commissionSettings,
        ugcSettings: validatedData.ugcSettings,
        payoutSettings: validatedData.payoutSettings,
      },
    });

    return createSuccessResponse(settings, 'Settings updated successfully');
  } catch (error) {
    console.error('Failed to update settings:', error);
    return createErrorResponse('Failed to update settings', 500);
  }
} 