import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const merchantSettings = await prisma.merchantSettings.findMany({
      include: {
        merchant: {
          select: {
            id: true,
            shop: true,
            onboardingCompleted: true,
            onboardingStep: true,
            onboardingData: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      count: merchantSettings.length,
      settings: merchantSettings,
    });
  } catch (error) {
    console.error('Failed to fetch merchant settings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 