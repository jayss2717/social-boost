import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAndRefreshToken, generateReauthUrl } from '@/utils/shopify';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const merchantId = url.searchParams.get('merchantId');
    
    if (!shop && !merchantId) {
      return NextResponse.json({ error: 'Shop or merchantId parameter required' }, { status: 400 });
    }

    let targetShop = shop;
    
    // If merchantId provided, get the shop from database
    if (merchantId && !shop) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { shop: true, accessToken: true, isActive: true }
      });
      
      if (!merchant) {
        return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
      }
      
      targetShop = merchant.shop;
    }

    if (!targetShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 400 });
    }

    console.log('🔍 Checking Shopify auth for shop:', targetShop);

    // Get merchant details
    const merchant = await prisma.merchant.findUnique({
      where: { shop: targetShop },
      select: { 
        id: true, 
        shop: true, 
        accessToken: true, 
        isActive: true,
        shopName: true,
        shopEmail: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!merchant) {
      return NextResponse.json({ 
        error: 'Merchant not found',
        shop: targetShop
      }, { status: 404 });
    }

    console.log('📋 Merchant found:', {
      id: merchant.id,
      shop: merchant.shop,
      hasAccessToken: !!merchant.accessToken,
      isActive: merchant.isActive,
      shopName: merchant.shopName,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt
    });

    // Validate the token
    const { isValid, needsReauth } = await validateAndRefreshToken(targetShop);
    
    const reauthUrl = needsReauth ? generateReauthUrl(targetShop) : undefined;

    console.log('🔐 Auth validation result:', {
      isValid,
      needsReauth,
      hasReauthUrl: !!reauthUrl
    });

    return NextResponse.json({
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        shopName: merchant.shopName,
        shopEmail: merchant.shopEmail,
        isActive: merchant.isActive,
        hasAccessToken: !!merchant.accessToken,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt
      },
      auth: {
        isValid,
        needsReauth,
        reauthUrl
      },
      message: isValid 
        ? '✅ Shopify access token is valid' 
        : needsReauth 
          ? '❌ Shopify access token is invalid - re-authentication required'
          : '⚠️ Shopify access token validation failed'
    });

  } catch (error) {
    console.error('❌ Error checking Shopify auth:', error);
    return NextResponse.json({ error: 'Failed to check Shopify auth' }, { status: 500 });
  }
} 