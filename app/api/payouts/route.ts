import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';
import { calculateCommission } from '@/utils/payouts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const influencerId = searchParams.get('influencerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const whereClause: Record<string, unknown> = { merchantId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (influencerId) {
      whereClause.influencerId = influencerId;
    }

    const payouts = await prisma.payout.findMany({
      where: whereClause,
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            commissionRate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.payout.count({ where: whereClause });

    return createSuccessResponse({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch payouts:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to fetch payouts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const body = await request.json();

    const { influencerId, originalAmount, discountedAmount, salesAmount } = body;

    // Validate required fields
    if (!influencerId || !originalAmount || !discountedAmount || !salesAmount) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Get influencer details
    const influencer = await prisma.influencer.findFirst({
      where: { 
        id: influencerId,
        merchantId,
      },
    });

    if (!influencer) {
      return createErrorResponse('Influencer not found', 404);
    }

    // Get merchant settings for commission calculation preference
    const merchantSettings = await prisma.merchantSettings.findUnique({
      where: { merchantId },
    });

    // Calculate commission using merchant's preference
    const commissionResult = calculateCommission({
      originalAmount,
      discountedAmount,
      commissionRate: influencer.commissionRate,
      calculationBase: merchantSettings?.commissionSettings?.commissionCalculationBase || 'DISCOUNTED_AMOUNT',
    });

    // Create payout with calculated commission
    const payout = await prisma.payout.create({
      data: {
        influencerId,
        amount: Math.round(commissionResult.commissionAmount * 100), // Convert to cents
        status: 'PENDING',
        periodStart: new Date(),
        periodEnd: new Date(),
        merchantId,
      },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            commissionRate: true,
          },
        },
      },
    });

    return createSuccessResponse({
      ...payout,
      commissionCalculation: commissionResult,
    }, 'Payout created successfully');
  } catch (error) {
    console.error('Failed to create payout:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to create payout', 500);
  }
} 