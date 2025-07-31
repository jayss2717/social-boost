import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test onboarding completion API called');
    const { shop, onboardingData } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('Processing test onboarding for shop:', shop);
    console.log('Onboarding data:', onboardingData);

    // Simulate successful onboarding completion
    console.log('Test onboarding completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test onboarding completed successfully',
      merchant: {
        id: 'test-merchant-id',
        shop: shop,
        onboardingCompleted: true,
      }
    });
  } catch (error) {
    console.error('Test onboarding completion error:', error);
    return NextResponse.json({ error: 'Test onboarding failed' }, { status: 500 });
  }
} 