import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    console.log('🧪 Testing webhook for shop:', shop);

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // First, let's create a test merchant to simulate the scenario
    console.log('Creating test merchant for webhook test...');
    
    const testMerchant = await prisma.merchant.create({
      data: {
        shop,
        accessToken: 'test-token',
        scope: 'read_products,write_products',
        shopifyShopId: 'test-shop-id',
        shopName: 'Test Store',
        shopEmail: 'test@example.com',
        shopDomain: shop,
        shopCurrency: 'USD',
        shopTimezone: 'UTC',
        shopLocale: 'en',
        onboardingCompleted: true,
        onboardingStep: 5,
        onboardingData: { test: true },
      },
    });

    console.log('✅ Test merchant created:', testMerchant.id);

    // Now simulate the app uninstall webhook
    console.log('Simulating app uninstall webhook...');
    
    const webhookBody = { shop };

    // Call the actual webhook handler
    const webhookResponse = await fetch('/api/webhooks/app-uninstalled', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookBody),
    });

    const webhookResult = await webhookResponse.json();
    
    console.log('Webhook response:', webhookResult);

    // Check if merchant was deleted
    const merchantAfterWebhook = await prisma.merchant.findUnique({
      where: { shop },
    });

    const testResult = {
      testMerchantCreated: !!testMerchant,
      testMerchantId: testMerchant.id,
      webhookCalled: webhookResponse.ok,
      webhookResponse: webhookResult,
      merchantDeleted: !merchantAfterWebhook,
      merchantExistsAfterWebhook: !!merchantAfterWebhook,
    };

    console.log('Test result:', testResult);

    return NextResponse.json({
      success: true,
      message: 'Webhook test completed',
      testResult,
    });
  } catch (error) {
    console.error('❌ Webhook test error:', error);
    return NextResponse.json({ error: 'Webhook test failed' }, { status: 500 });
  }
} 