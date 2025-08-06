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

    console.log('🔧 Fixing Shopify auth for shop:', targetShop);

    // Get merchant details
    const merchant = await prisma.merchant.findUnique({
      where: { shop: targetShop },
      select: { 
        id: true, 
        shop: true, 
        accessToken: true, 
        isActive: true,
        shopName: true,
        shopEmail: true
      }
    });

    if (!merchant) {
      return NextResponse.json({ 
        error: 'Merchant not found',
        shop: targetShop
      }, { status: 404 });
    }

    // Validate the token
    const { isValid, needsReauth } = await validateAndRefreshToken(targetShop);
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: '✅ Shopify access token is already valid',
        merchant: {
          id: merchant.id,
          shop: merchant.shop,
          shopName: merchant.shopName,
          hasAccessToken: !!merchant.accessToken,
          isActive: merchant.isActive
        },
        auth: { isValid, needsReauth }
      });
    }

    // Generate re-authentication URL
    const reauthUrl = generateReauthUrl(targetShop);

    return NextResponse.json({
      success: false,
      message: '❌ Shopify access token is invalid - re-authentication required',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        shopName: merchant.shopName,
        hasAccessToken: !!merchant.accessToken,
        isActive: merchant.isActive
      },
      auth: { 
        isValid, 
        needsReauth,
        reauthUrl 
      },
      instructions: [
        '1. Click the re-authentication URL below',
        '2. Follow the Shopify OAuth flow',
        '3. Grant the required permissions',
        '4. You will be redirected back to the app',
        '5. The "Generate Code" button should work after re-authentication'
      ]
    });

  } catch (error) {
    console.error('❌ Error fixing Shopify auth:', error);
    return NextResponse.json({ error: 'Failed to fix Shopify auth' }, { status: 500 });
  }
} 