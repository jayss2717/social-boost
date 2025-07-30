import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { processPayoutViaStripe } from '@/utils/payouts';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const merchantId = request.headers.get('x-merchant-id');

    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    // Verify payout exists and belongs to merchant
    const payout = await prisma.payout.findFirst({
      where: {
        id,
        merchantId,
      },
      include: {
        influencer: true,
      },
    });

    if (!payout) {
      return createErrorResponse('Payout not found', 404);
    }

    if (payout.status !== 'PENDING') {
      return createErrorResponse(`Payout is already ${payout.status.toLowerCase()}`, 400);
    }

    // Process payout via Stripe
    try {
      const transfer = await processPayoutViaStripe(id);
      
      return createSuccessResponse({
        payoutId: id,
        transferId: transfer.id,
        amount: payout.amount,
        influencerName: payout.influencer?.name,
      }, 'Payout processed successfully');
    } catch (error) {
      console.error('Stripe payout failed:', error);
      return createErrorResponse('Failed to process payout via Stripe', 500);
    }
  } catch (error) {
    console.error('Failed to process payout:', error);
    return createErrorResponse('Failed to process payout', 500);
  }
} 