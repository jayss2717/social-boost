import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Test Stripe connection
    const testAccount = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'test@example.com',
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        url: 'https://socialboost.com',
        mcc: '5734',
      },
    });

    return NextResponse.json({
      success: true,
      accountId: testAccount.id,
      message: 'Stripe Connect account created successfully',
    });
  } catch (error) {
    console.error('Stripe test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    }, { status: 500 });
  }
} 