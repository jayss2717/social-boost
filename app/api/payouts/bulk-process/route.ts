import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';
import { processBulkPayouts } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const body = await request.json();

    const { payoutIds } = body;

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return createErrorResponse('Invalid payout IDs', 400);
    }

    // Verify all payouts belong to this merchant
    const payouts = await prisma.payout.findMany({
      where: {
        id: { in: payoutIds },
        influencer: {
          merchantId,
        },
      },
      include: {
        influencer: true,
      },
    });

    if (payouts.length !== payoutIds.length) {
      return createErrorResponse('Some payouts not found or do not belong to this merchant', 404);
    }

    // Process payouts through Stripe
    const results = await processBulkPayouts(payoutIds);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return createSuccessResponse({
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    }, `Processed ${successCount} payouts successfully, ${failureCount} failed`);
  } catch (error) {
    console.error('Failed to process bulk payouts:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to process bulk payouts', 500);
  }
} 