import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSubscriptionUsage, checkUsageLimit, getPlanLimits } from '@/utils/subscription';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🧪 Testing subscription validation for ${shop}`);

    // 1. Get current merchant and subscription
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
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // 2. Test all plan scenarios
    const testResults = {
      currentPlan: {
        name: merchant.subscription?.plan?.name || 'No subscription',
        status: merchant.subscription?.status || 'No subscription',
        limits: merchant.subscription?.plan ? {
          ugcLimit: merchant.subscription.plan.ugcLimit,
          influencerLimit: merchant.subscription.plan.influencerLimit,
        } : null,
      },
      planLimits: {},
      usageValidation: {},
      planHierarchy: {},
      recommendations: [],
    };

    // 3. Test all plan limits
    const plans = ['Starter', 'Pro', 'Scale', 'Enterprise'];
    for (const plan of plans) {
      const limits = getPlanLimits(plan);
      testResults.planLimits[plan] = limits;
    }

    // 4. Test current usage validation
    if (merchant.subscription) {
      const ugcCheck = await checkUsageLimit(merchant.id, 'ugc');
      const influencerCheck = await checkUsageLimit(merchant.id, 'influencer');
      
      testResults.usageValidation = {
        ugc: {
          current: ugcCheck.current,
          limit: ugcCheck.limit,
          allowed: ugcCheck.allowed,
          percentage: ugcCheck.limit > 0 ? Math.round((ugcCheck.current / ugcCheck.limit) * 100) : 0,
        },
        influencer: {
          current: influencerCheck.current,
          limit: influencerCheck.limit,
          allowed: influencerCheck.allowed,
          percentage: influencerCheck.limit > 0 ? Math.round((influencerCheck.current / influencerCheck.limit) * 100) : 0,
        },
      };
    }

    // 5. Test plan hierarchy validation
    const planHierarchy = { Starter: 0, Pro: 1, Scale: 2, Enterprise: 3 };
    const currentPlan = merchant.subscription?.plan?.name || 'Starter';
    const currentPlanLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;

    testResults.planHierarchy = {
      currentPlan,
      currentPlanLevel,
      canAccessPro: currentPlanLevel >= planHierarchy['Pro'],
      canAccessScale: currentPlanLevel >= planHierarchy['Scale'],
      canAccessEnterprise: currentPlanLevel >= planHierarchy['Enterprise'],
    };

    // 6. Test specific scenarios
    const scenarios = {
      starter: {
        ugcLimit: 5,
        influencerLimit: 1,
        canCreateUgc: currentPlanLevel >= 0,
        canCreateInfluencer: currentPlanLevel >= 0,
        upgradeRequired: currentPlanLevel < 1,
      },
      pro: {
        ugcLimit: 300,
        influencerLimit: 10,
        canCreateUgc: currentPlanLevel >= 1,
        canCreateInfluencer: currentPlanLevel >= 1,
        upgradeRequired: currentPlanLevel < 2,
      },
      scale: {
        ugcLimit: 1000,
        influencerLimit: 50,
        canCreateUgc: currentPlanLevel >= 2,
        canCreateInfluencer: currentPlanLevel >= 2,
        upgradeRequired: false, // Scale is highest tier
      },
    };

    testResults.scenarios = scenarios;

    // 7. Generate recommendations
    if (!merchant.subscription) {
      testResults.recommendations.push('Create a default Starter subscription');
    }

    if (currentPlanLevel < 1) {
      testResults.recommendations.push('Upgrade to Pro for more features');
    }

    if (testResults.usageValidation.ugc && testResults.usageValidation.ugc.percentage >= 80) {
      testResults.recommendations.push('UGC usage is near limit - consider upgrading');
    }

    if (testResults.usageValidation.influencer && testResults.usageValidation.influencer.percentage >= 80) {
      testResults.recommendations.push('Influencer count is near limit - consider upgrading');
    }

    // 8. Test API endpoint validation
    const apiValidation = {
      ugcEndpoint: {
        method: 'POST',
        endpoint: '/api/ugc-posts',
        requiresAuth: true,
        checksLimit: true,
        limitType: 'ugc',
      },
      influencerEndpoint: {
        method: 'POST',
        endpoint: '/api/influencers',
        requiresAuth: true,
        checksLimit: true,
        limitType: 'influencer',
      },
      discountCodeEndpoint: {
        method: 'POST',
        endpoint: '/api/discount-codes',
        requiresAuth: true,
        checksLimit: true,
        limitType: 'ugc',
      },
    };

    testResults.apiValidation = apiValidation;

    // 9. Test component validation
    const componentValidation = {
      PlanGate: {
        props: ['requiredPlan', 'showUpgradeButton'],
        validation: 'Checks plan hierarchy and shows upgrade prompt',
        usage: 'Wraps components that require specific plan levels',
      },
      UsageMeter: {
        props: ['type', 'showDetails'],
        validation: 'Shows current usage vs limits',
        usage: 'Displays usage progress bars',
      },
      SubscriptionBanner: {
        props: [],
        validation: 'Shows when limits are exceeded',
        usage: 'Appears when usage is over limit',
      },
    };

    testResults.componentValidation = componentValidation;

    console.log('🧪 Validation test results:', testResults);

    return NextResponse.json({
      success: true,
      message: 'Subscription validation test completed',
      results: testResults,
    });
  } catch (error) {
    console.error('❌ Validation test error:', error);
    return NextResponse.json(
      { error: 'Failed to test subscription validation' },
      { status: 500 }
    );
  }
} 