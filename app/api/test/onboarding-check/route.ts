import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    // Simulate merchant data for testing
    const mockMerchant = {
      id: 'test-merchant-id',
      shop: shop || 'test-store.myshopify.com',
      shopName: 'Test Store',
      shopEmail: 'test@store.com',
      shopDomain: 'test-store.myshopify.com',
      shopCurrency: 'USD',
      onboardingCompleted: false, // Always false for testing
      onboardingStep: 0,
    };

    return NextResponse.json(mockMerchant);
  } catch (error) {
    console.error('Failed to fetch test merchant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 