import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { getPayoutSummary } from '@/utils/payouts';
import { requireMerchantId } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    const summary = await getPayoutSummary(merchantId);

    return createSuccessResponse(summary);
  } catch (error) {
    console.error('Failed to fetch payout summary:', error);
    return createErrorResponse('Failed to fetch payout summary', 500);
  }
} 