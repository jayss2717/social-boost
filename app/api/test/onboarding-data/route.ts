import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        shop: true,
        onboardingCompleted: true,
        onboardingStep: true,
        onboardingData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      merchants: merchants,
    });
  } catch (error) {
    console.error('Failed to fetch onboarding data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 