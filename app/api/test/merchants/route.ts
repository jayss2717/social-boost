import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return createErrorResponse('This endpoint is only available in development', 403);
    }

    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        shop: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to 5 merchants
    });

    return createSuccessResponse(merchants);
  } catch (error) {
    console.error('Failed to fetch merchants:', error);
    return createErrorResponse('Failed to fetch merchants', 500);
  }
} 