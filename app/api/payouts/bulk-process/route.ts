import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { processAutoPayouts, processBulkPayouts } from '@/utils/payouts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    const body = await request.json();
    const { mode = 'auto' } = body; // 'auto' or 'manual'

    let results;

    if (mode === 'auto') {
      // Use auto-payout logic based on merchant settings
      results = await processAutoPayouts(merchantId);
    } else {
      // Use manual bulk processing (process all pending)
      results = await processBulkPayouts(merchantId);
    }

    return createSuccessResponse({
      mode,
      ...results,
      timestamp: new Date().toISOString(),
    }, `Bulk payout processing completed. ${results.processed} processed, ${results.skipped} skipped.`);
  } catch (error) {
    console.error('Failed to bulk process payouts:', error);
    return createErrorResponse('Failed to bulk process payouts', 500);
  }
} 