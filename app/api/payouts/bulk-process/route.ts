import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { processBulkPayouts } from '@/utils/payouts';

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');

    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    // Get pending payouts count
    const pendingCount = await prisma.payout.count({
      where: {
        merchantId,
        status: 'PENDING',
      },
    });

    if (pendingCount === 0) {
      return createErrorResponse('No pending payouts to process', 400);
    }

    // Process all pending payouts
    const results = await processBulkPayouts(merchantId);

    return createSuccessResponse({
      processed: results.processed,
      failed: results.failed,
      errors: results.errors,
      total: pendingCount,
    }, `Bulk payout processing completed. ${results.processed} processed, ${results.failed} failed.`);
  } catch (error) {
    console.error('Failed to process bulk payouts:', error);
    return createErrorResponse('Failed to process bulk payouts', 500);
  }
} 