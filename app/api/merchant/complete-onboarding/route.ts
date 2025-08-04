import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { merchantId } = await request.json();

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 });
    }

    // Update merchant to mark onboarding as completed
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        onboardingCompleted: true,
        onboardingStep: 5,
      },
    });

    console.log('Merchant onboarding completed after payment:', merchant.id);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        onboardingCompleted: merchant.onboardingCompleted,
      }
    });

  } catch (error) {
    console.error('Failed to complete merchant onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 