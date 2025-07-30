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

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful for payouts');
    } catch (dbError) {
      console.error('❌ Database connection failed for payouts:', dbError);
      // Return mock data if database is unavailable
      return createSuccessResponse([
        {
          id: 'mock-1',
          merchantId,
          influencerId: 'mock-influencer-1',
          amount: 5000,
          status: 'PENDING',
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          stripeTransferId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          influencer: {
            id: 'mock-influencer-1',
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
          },
        },
        {
          id: 'mock-2',
          merchantId,
          influencerId: 'mock-influencer-2',
          amount: 3000,
          status: 'COMPLETED',
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: new Date().toISOString(),
          stripeTransferId: 'txn_mock_123',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          influencer: {
            id: 'mock-influencer-2',
            name: 'Mike Johnson',
            email: 'mike@example.com',
          },
        },
      ], 'Mock data - database connection failed');
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