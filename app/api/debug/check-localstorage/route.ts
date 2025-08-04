import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    // This is a client-side check, so we'll return instructions
    return NextResponse.json({
      success: true,
      message: 'LocalStorage check instructions',
      instructions: [
        'Open browser developer tools (F12)',
        'Go to Application/Storage tab',
        'Check localStorage for "merchantId" key',
        'Check console for API call logs',
        'Verify merchantId is being set correctly'
      ],
      expectedBehavior: {
        merchantId: 'Should be present in localStorage',
        apiCalls: 'Should include x-merchant-id header',
        subscriptionData: 'Should show Pro plan details'
      },
      troubleshooting: {
        step1: 'Check if merchantId exists in localStorage',
        step2: 'Check browser console for API call logs',
        step3: 'Verify useSubscription hook is receiving data',
        step4: 'Check if billing page is using correct data'
      }
    });
  } catch (error) {
    console.error('LocalStorage debug error:', error);
    return NextResponse.json({ error: 'Failed to check localStorage' }, { status: 500 });
  }
} 