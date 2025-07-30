import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        shop: true,
        shopName: true,
        shopEmail: true,
        shopDomain: true,
        shopCurrency: true,
        onboardingCompleted: true,
        onboardingStep: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      count: merchants.length,
      merchants,
    });
  } catch (error) {
    console.error('Failed to fetch merchants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 