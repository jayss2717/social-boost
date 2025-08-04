import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, shop } = body;

    if (!merchantId && !shop) {
      return NextResponse.json({ error: 'Merchant ID or shop required' }, { status: 400 });
    }

    let merchant;
    
    if (merchantId) {
      // Update merchant by ID
      merchant = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          onboardingCompleted: true,
          onboardingStep: 5,
        },
      });
    } else if (shop) {
      // Update merchant by shop
      merchant = await prisma.merchant.update({
        where: { shop },
        data: {
          onboardingCompleted: true,
          onboardingStep: 5,
        },
      });
    }

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

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