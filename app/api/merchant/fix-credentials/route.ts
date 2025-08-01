import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateMerchantCredentials, fixMerchantCredentials } from '@/lib/merchant-credentials';

export async function POST(request: NextRequest) {
  try {
    const { shop } = await request.json();

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Get the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check if credentials need fixing
    const needsFixing = !validateMerchantCredentials(merchant);
    
    if (!needsFixing) {
      return NextResponse.json({
        success: true,
        message: 'Merchant credentials are already valid',
        merchant: {
          id: merchant.id,
          shop: merchant.shop,
          accessToken: merchant.accessToken ? '***' : null,
          shopifyShopId: merchant.shopifyShopId,
          shopName: merchant.shopName,
          isActive: merchant.isActive
        }
      });
    }

    // Try to fix the credentials
    const result = await fixMerchantCredentials(shop);

    if (result.success) {
      // Get updated merchant data
      const updatedMerchant = await prisma.merchant.findUnique({
        where: { shop }
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        merchant: {
          id: updatedMerchant?.id,
          shop: updatedMerchant?.shop,
          accessToken: updatedMerchant?.accessToken ? '***' : null,
          shopifyShopId: updatedMerchant?.shopifyShopId,
          shopName: updatedMerchant?.shopName,
          isActive: updatedMerchant?.isActive
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        requiresOAuth: true,
        oauthUrl: `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=read_products,write_products&redirect_uri=${process.env.HOST}/api/auth/shopify/callback`
      });
    }

  } catch (error) {
    console.error('Error fixing merchant credentials:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Get the merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shop }
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Check credential status
    const isValid = validateMerchantCredentials(merchant);

    return NextResponse.json({
      success: true,
      isValid,
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        accessToken: merchant.accessToken ? '***' : null,
        shopifyShopId: merchant.shopifyShopId,
        shopName: merchant.shopName,
        isActive: merchant.isActive,
        needsOAuth: !isValid
      }
    });

  } catch (error) {
    console.error('Error checking merchant credentials:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 