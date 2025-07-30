import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        shop: true,
        onboardingCompleted: true,
        onboardingStep: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      merchants,
      total: merchants.length,
    });
  } catch (error) {
    console.error('Failed to fetch merchants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 