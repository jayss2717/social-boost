import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Get all merchants to check for interference
    const allMerchants = await prisma.merchant.findMany({
      select: {
        id: true,
        shop: true,
        accessToken: true,
        shopifyShopId: true,
        scope: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get current merchant
    const currentMerchant = await prisma.merchant.findUnique({
      where: { shop },
      select: {
        id: true,
        shop: true,
        accessToken: true,
        shopifyShopId: true,
        scope: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check for potential interference
    const potentialIssues = [];

    // Check for duplicate shopifyShopId
    const shopifyShopIds = allMerchants
      .filter(m => m.shopifyShopId)
      .map(m => m.shopifyShopId);
    const duplicateShopIds = shopifyShopIds.filter((id, index) => 
      shopifyShopIds.indexOf(id) !== index
    );

    if (duplicateShopIds.length > 0) {
      potentialIssues.push({
        type: 'DUPLICATE_SHOP_ID',
        message: 'Multiple merchants have the same shopifyShopId',
        shops: allMerchants.filter(m => duplicateShopIds.includes(m.shopifyShopId)).map(m => m.shop),
      });
    }

    // Check for merchants with pending tokens
    const pendingTokens = allMerchants.filter(m => m.accessToken === 'pending');
    if (pendingTokens.length > 0) {
      potentialIssues.push({
        type: 'PENDING_TOKENS',
        message: `${pendingTokens.length} merchants have pending access tokens`,
        shops: pendingTokens.map(m => m.shop),
      });
    }

    // Check for merchants with null shopifyShopId
    const nullShopIds = allMerchants.filter(m => !m.shopifyShopId);
    if (nullShopIds.length > 0) {
      potentialIssues.push({
        type: 'NULL_SHOP_IDS',
        message: `${nullShopIds.length} merchants have null shopifyShopId`,
        shops: nullShopIds.map(m => m.shop),
      });
    }

    // Check for inactive merchants
    const inactiveMerchants = allMerchants.filter(m => !m.isActive);
    if (inactiveMerchants.length > 0) {
      potentialIssues.push({
        type: 'INACTIVE_MERCHANTS',
        message: `${inactiveMerchants.length} merchants are inactive`,
        shops: inactiveMerchants.map(m => m.shop),
      });
    }

    // Analyze OAuth completion rate
    const totalMerchants = allMerchants.length;
    const completedOAuth = allMerchants.filter(m => 
      m.accessToken && 
      m.accessToken !== 'pending' && 
      m.shopifyShopId
    ).length;
    const oauthCompletionRate = totalMerchants > 0 ? (completedOAuth / totalMerchants) * 100 : 0;

    return NextResponse.json({
      success: true,
      shop,
      currentMerchant,
      analysis: {
        totalMerchants,
        completedOAuth,
        oauthCompletionRate: `${oauthCompletionRate.toFixed(1)}%`,
        potentialIssues,
        allMerchants: allMerchants.map(m => ({
          shop: m.shop,
          hasAccessToken: m.accessToken && m.accessToken !== 'pending',
          hasShopId: !!m.shopifyShopId,
          isActive: m.isActive,
          createdAt: m.createdAt,
        })),
      },
      recommendations: potentialIssues.length > 0 ? [
        'Check OAuth callback flow for stores with pending tokens',
        'Verify shopifyShopId is being set correctly in OAuth callback',
        'Ensure each store gets unique OAuth credentials',
        'Check for race conditions in merchant creation',
      ] : [
        'OAuth flow appears to be working correctly',
        'Each store has unique credentials',
        'No interference detected',
      ],
    });
  } catch (error) {
    console.error('Multi-store OAuth test error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 