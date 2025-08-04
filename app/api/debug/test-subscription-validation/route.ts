import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUsageLimit, getPlanLimits } from '@/utils/subscription';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🔍 Testing subscription validation for ${shop}`);

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({
        success: false,
        message: 'Merchant not found',
        shop,
        recommendations: ['Create merchant record for this shop'],
      });
    }

    const testResults: {
      success: boolean;
      message: string;
      merchant: {
        id: string;
        shop: string;
        name: string | null;
        email: string | null;
        onboardingCompleted: boolean;
      };
      subscription: {
        plan: string | null;
        status: string | null;
        limits: {
          ugcLimit: number | null;
          influencerLimit: number | null;
        };
      } | null;
      scenarios: {
        planLimits: Record<string, unknown>;
        usageValidation: Record<string, unknown>;
        planHierarchy: Record<string, unknown>;
      };
      apiValidation: Record<string, unknown>;
      componentValidation: Record<string, unknown>;
      recommendations: string[];
    } = {
      success: true,
      message: 'Subscription validation test completed',
      merchant: {
        id: merchant.id,
        shop: merchant.shop,
        name: merchant.shopName,
        email: merchant.shopEmail,
        onboardingCompleted: merchant.onboardingCompleted,
      },
      subscription: merchant.subscription ? {
        plan: merchant.subscription.plan?.name,
        status: merchant.subscription.status,
        limits: {
          ugcLimit: merchant.subscription.plan?.ugcLimit,
          influencerLimit: merchant.subscription.plan?.influencerLimit,
        },
      } : null,
      scenarios: {
        planLimits: {},
        usageValidation: {},
        planHierarchy: {},
      },
      apiValidation: {},
      componentValidation: {},
      recommendations: [],
    };

    // Test plan limits
    if (merchant.subscription?.plan) {
      const limits = getPlanLimits(merchant.subscription.plan.name);
      testResults.scenarios.planLimits = {
        plan: merchant.subscription.plan.name,
        ugcLimit: limits.ugcLimit,
        influencerLimit: limits.influencerLimit,
        isValid: limits.ugcLimit > 0 && limits.influencerLimit > 0,
      };
    }

    // Test usage validation
    if (merchant.subscription?.plan) {
      const usageCheck = checkUsageLimit(merchant.subscription.plan.name, 'ugc', 5);
      testResults.scenarios.usageValidation = {
        plan: merchant.subscription.plan.name,
        usageType: 'ugc',
        usageCount: 5,
        limit: getPlanLimits(merchant.subscription.plan.name).ugcLimit,
        isValid: usageCheck.isValid,
        remaining: usageCheck.remaining,
      };
    }

    // Test plan hierarchy
    const plans = await prisma.plan.findMany({
      orderBy: { priceCents: 'asc' },
    });
    
    testResults.scenarios.planHierarchy = {
      plans: plans.map(plan => ({
        name: plan.name,
        price: plan.priceCents,
        ugcLimit: plan.ugcLimit,
        influencerLimit: plan.influencerLimit,
      })),
      isValid: plans.length >= 3, // Should have at least Starter, Pro, Scale
    };

    // Generate recommendations
    if (!merchant.onboardingCompleted) {
      testResults.recommendations.push('Merchant onboarding is not completed');
    }

    if (!merchant.subscription) {
      testResults.recommendations.push('No subscription found for merchant');
    }

    if (merchant.subscription && merchant.subscription.status !== 'ACTIVE') {
      testResults.recommendations.push(`Subscription status is ${merchant.subscription.status}, should be ACTIVE`);
    }

    console.log('🔍 Subscription validation test results:', testResults);

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('❌ Subscription validation test error:', error);
    return NextResponse.json(
      { error: 'Failed to test subscription validation' },
      { status: 500 }
    );
  }
} 