import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AutomatedCodeGenerator } from '@/utils/automated-codes';
import { requireMerchantId } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const body = await request.json();
    const { influencerIds, options = {} } = body;

    // Get merchant details for Shopify integration
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { accessToken: true, shop: true },
    });

    const generator = new AutomatedCodeGenerator(
      merchantId,
      merchant?.accessToken,
      merchant?.shop
    );

    let results: unknown[] = [];

    if (influencerIds && influencerIds.length > 0) {
      // Generate codes for specific influencers
      results = await generator.batchGenerateCodes(influencerIds, options);
    } else {
      // Auto-generate based on triggers
      const triggers = await generator.autoGenerateBasedOnTriggers();
      
      const triggeredInfluencerIds = triggers
        .filter(trigger => trigger.priority === 'high' || trigger.priority === 'medium')
        .map(trigger => trigger.influencerId);

      if (triggeredInfluencerIds.length > 0) {
        results = await generator.batchGenerateCodes(triggeredInfluencerIds, options);
      } else {
        results = [];
      }
    }

    return createSuccessResponse(results, 'Automated code generation completed');
  } catch (error) {
    console.error('Failed to generate automated codes:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to generate automated codes', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const { searchParams } = new URL(request.url);
    const influencerId = searchParams.get('influencerId');

    const generator = new AutomatedCodeGenerator(merchantId);
    const analytics = await generator.getCodePerformanceAnalytics(influencerId || undefined);

    return createSuccessResponse(analytics);
  } catch (error) {
    console.error('Failed to get code performance analytics:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to get code performance analytics', 500);
  }
} 