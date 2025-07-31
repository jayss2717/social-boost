import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test creating different types of codes
    const testMerchantId = 'test-merchant-' + Date.now();
    
    // Create a test merchant first
    const merchant = await prisma.merchant.create({
      data: {
        id: testMerchantId,
        shop: 'test-shop-' + Date.now() + '.myshopify.com',
        shopifyShopId: 'test-shop-' + Date.now(),
        accessToken: 'test-token',
        scope: 'read_products',
        isActive: true,
        onboardingCompleted: false,
      },
    });
    
    // Create a test influencer
    const influencer = await prisma.influencer.create({
      data: {
        merchantId: testMerchantId,
        name: 'Test Influencer',
        email: 'test@example.com',
        commissionRate: 10,
      },
    });

    // Create an INFLUENCER code (reusable)
    const influencerCode = await prisma.discountCode.create({
      data: {
        merchantId: testMerchantId,
        influencerId: influencer.id,
        code: 'TESTINF100',
        codeType: 'INFLUENCER',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        usageLimit: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Create a RANDOM code (one-time use)
    const randomCode = await prisma.discountCode.create({
      data: {
        merchantId: testMerchantId,
        code: 'RANDOM123',
        codeType: 'RANDOM',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        usageLimit: 1, // One-time use
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Fetch and verify the codes
    const codes = await prisma.discountCode.findMany({
      where: { merchantId: testMerchantId },
      orderBy: { createdAt: 'desc' },
    });

    // Clean up test data
    await prisma.discountCode.deleteMany({
      where: { merchantId: testMerchantId },
    });
    await prisma.influencer.delete({
      where: { id: influencer.id },
    });
    await prisma.merchant.delete({
      where: { id: testMerchantId },
    });

    return NextResponse.json({
      success: true,
      message: 'Code type distinction test completed',
      data: {
        influencerCode: {
          code: influencerCode.code,
          codeType: influencerCode.codeType,
          usageLimit: influencerCode.usageLimit,
          expiresInDays: Math.ceil((influencerCode.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        },
        randomCode: {
          code: randomCode.code,
          codeType: randomCode.codeType,
          usageLimit: randomCode.usageLimit,
          expiresInDays: Math.ceil((randomCode.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        },
        allCodes: codes.map(code => ({
          code: code.code,
          codeType: code.codeType,
          usageLimit: code.usageLimit,
          influencerId: code.influencerId,
        })),
      },
    });
  } catch (error) {
    console.error('Code type test error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 