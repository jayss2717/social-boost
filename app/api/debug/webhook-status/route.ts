import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    console.log('🔍 Debug webhook status for shop:', shop);

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        influencers: {
          include: {
            discountCodes: true,
            payouts: true,
          },
        },
        ugcPosts: true,
        discountCodes: true,
        payouts: true,
        socialMediaAccounts: true,
        brandMentions: true,
        orderMetrics: true,
        ugcRejections: true,
        ugcWorkflowRules: true,
        settings: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({
        status: 'NO_MERCHANT',
        message: 'No merchant found for this shop',
        shop,
        webhookRegistration: 'Check Shopify Partner Dashboard',
      });
    }

    // Count related data
    const dataCounts = {
      merchant: true,
      subscription: merchant.subscription ? {
        id: merchant.subscription.id,
        status: merchant.subscription.status,
        plan: merchant.subscription.plan?.name,
      } : null,
      influencers: merchant.influencers.length,
      ugcPosts: merchant.ugcPosts.length,
      discountCodes: merchant.discountCodes.length,
      payouts: merchant.payouts.length,
      socialMediaAccounts: merchant.socialMediaAccounts.length,
      brandMentions: merchant.brandMentions.length,
      orderMetrics: merchant.orderMetrics.length,
      ugcRejections: merchant.ugcRejections.length,
      ugcWorkflowRules: merchant.ugcWorkflowRules.length,
      settings: merchant.settings ? {
        id: merchant.settings.id,
        name: merchant.settings.name,
      } : null,
    };

    // Check webhook registration status
    const webhookStatus = {
      appUninstalled: 'Check Shopify Partner Dashboard',
      shopRedact: 'Check Shopify Partner Dashboard',
      customersRedact: 'Check Shopify Partner Dashboard',
      ordersCreate: 'Check Shopify Partner Dashboard',
      stripe: 'Check Stripe Dashboard',
    };

    return NextResponse.json({
      status: 'MERCHANT_FOUND',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        onboardingCompleted: merchant.onboardingCompleted,
        accessToken: merchant.accessToken ? 'SET' : 'MISSING',
        shopifyShopId: merchant.shopifyShopId,
        isActive: merchant.isActive,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
      },
      dataCounts,
      webhookStatus,
      recommendations: [
        'Check Shopify Partner Dashboard for webhook registration',
        'Verify webhook endpoints are accessible',
        'Check webhook delivery logs in Shopify',
        'Ensure webhook URLs are correct: https://socialboost-blue.vercel.app/api/webhooks/app-uninstalled',
      ],
    });
  } catch (error) {
    console.error('❌ Debug webhook status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 