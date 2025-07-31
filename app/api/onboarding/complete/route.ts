import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Onboarding completion API called');
    const { shop, onboardingData } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('Processing onboarding for shop:', shop);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    try {
      // Simple approach: just update or create merchant without complex settings
      const merchant = await prisma.merchant.upsert({
        where: { shop },
        update: {
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: onboardingData,
        },
        create: {
          shop,
          accessToken: 'test-token',
          scope: 'read_products,write_products',
          shopifyShopId: '123456789',
          shopName: shop.replace('.myshopify.com', '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          shopEmail: `admin@${shop}`,
          shopDomain: shop,
          shopCurrency: 'USD',
          shopTimezone: 'UTC',
          shopLocale: 'en',
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: onboardingData,
        },
      });

      console.log('Merchant created/updated successfully:', merchant.id);

      return NextResponse.json({ 
        success: true, 
        message: 'Onboarding completed successfully',
        merchant: {
          id: merchant.id,
          shop: merchant.shop,
          onboardingCompleted: merchant.onboardingCompleted,
        }
      });

    } catch (dbError) {
      console.error('Database error in onboarding completion:', dbError);
      
      // Try to provide more specific error information
      if (dbError instanceof Error) {
        console.error('Error name:', dbError.name);
        console.error('Error message:', dbError.message);
        console.error('Error stack:', dbError.stack);
      }
      
      // Check if it's a connection issue
      if (dbError instanceof Error && dbError.message.includes('connection')) {
        return NextResponse.json({ error: 'Database connection failed - connection issue' }, { status: 503 });
      }
      
      // Check if it's a validation issue
      if (dbError instanceof Error && dbError.message.includes('validation')) {
        return NextResponse.json({ error: 'Database validation failed' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Database operation failed' }, { status: 503 });
    }
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 