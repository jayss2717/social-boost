import { NextRequest } from 'next/server';
import { EnhancedCommissionTracker } from '@/utils/enhanced-commission';
import { requireMerchantId } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const { searchParams } = new URL(request.url);
    const influencerId = searchParams.get('influencerId');

    const tracker = new EnhancedCommissionTracker(merchantId);
    const analytics = await tracker.getCommissionAnalytics(influencerId || undefined);

    return createSuccessResponse(analytics);
  } catch (error) {
    console.error('Failed to get enhanced commission analytics:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to get enhanced commission analytics', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const body = await request.json();
    const { influencerId, periodStart, periodEnd } = body;

    if (!influencerId) {
      return createErrorResponse('Influencer ID is required', 400);
    }

    const tracker = new EnhancedCommissionTracker(merchantId);
    
    // Calculate enhanced commission with AI insights
    const calculation = await tracker.calculateEnhancedCommission(
      influencerId,
      new Date(periodStart),
      new Date(periodEnd)
    );

    return createSuccessResponse(calculation, 'Enhanced commission calculation completed');
  } catch (error) {
    console.error('Failed to calculate enhanced commission:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to calculate enhanced commission', 500);
  }
} 