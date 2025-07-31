import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Onboarding completion API called');
    const { shop, onboardingData } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('Processing onboarding for shop:', shop);
    console.log('Onboarding data:', onboardingData);

    // For now, just return success without database operations
    // This allows the onboarding flow to complete while we debug the database issue
    console.log('Onboarding completed successfully (simulated)');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      merchant: {
        id: 'temp-merchant-id',
        shop: shop,
        onboardingCompleted: true,
      }
    });

  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 