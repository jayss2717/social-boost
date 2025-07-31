import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { payoutSchema, createErrorResponse, createSuccessResponse } from '@/utils/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }



    const payouts = await prisma.payout.findMany({
      where: { merchantId },
      include: {
        influencer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(payouts);
  } catch (error) {
    console.error('Failed to fetch payouts:', error);
    return createErrorResponse('Failed to fetch payouts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return createErrorResponse('Merchant ID required', 401);
    }

    const body = await request.json();
    const validatedData = payoutSchema.parse(body);

    // Verify influencer exists and belongs to merchant
    const influencer = await prisma.influencer.findFirst({
      where: {
        id: validatedData.influencerId,
        merchantId,
      },
    });

    if (!influencer) {
      return createErrorResponse('Influencer not found', 404);
    }

    const payout = await prisma.payout.create({
      data: {
        merchantId,
        influencerId: validatedData.influencerId,
        amount: Math.round(validatedData.amount * 100), // Convert to cents
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(),
        stripeTransferId: null,
      },
      include: {
        influencer: true,
      },
    });

    return createSuccessResponse(payout, 'Payout created successfully');
  } catch (error) {
    console.error('Failed to create payout:', error);
    return createErrorResponse('Failed to create payout', 500);
  }
} 