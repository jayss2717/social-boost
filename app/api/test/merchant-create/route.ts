import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { shop } = await request.json();
    
    console.log('Testing merchant creation for shop:', shop);
    
    // Test 1: Simple merchant creation
    const merchant = await prisma.merchant.create({
      data: {
        shop: `test-${Date.now()}.myshopify.com`,
        accessToken: 'test-token',
        scope: 'read_products,write_products',
        shopifyShopId: `create-${Date.now()}`,
        shopName: 'Test Store',
        shopEmail: 'test@store.com',
        shopDomain: `test-${Date.now()}.myshopify.com`,
        shopCurrency: 'USD',
        shopTimezone: 'UTC',
        shopLocale: 'en',
        onboardingCompleted: false,
        onboardingStep: 0,
      },
    });
    
    console.log('Merchant created successfully:', merchant.id);
    
    // Clean up - delete the test merchant
    await prisma.merchant.delete({
      where: { id: merchant.id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Merchant creation test successful',
      merchantId: merchant.id
    });
    
  } catch (error) {
    console.error('Merchant creation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 