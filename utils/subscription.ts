import { prisma } from '@/lib/prisma';

export interface SubscriptionUsage {
  ugcCount: number;
  influencerCount: number;
  ugcLimit: number;
  influencerLimit: number;
}

export interface PlanLimits {
  ugcLimit: number;
  influencerLimit: number;
}

export const getSubscriptionUsage = async (merchantId: string): Promise<SubscriptionUsage> => {
  const [ugcCount, influencerCount, subscription] = await Promise.all([
    prisma.ugcPost.count({ where: { merchantId } }),
    prisma.influencer.count({ where: { merchantId } }),
    prisma.subscription.findUnique({
      where: { merchantId },
      include: { plan: true },
    }),
  ]);

  const limits = await getPlanLimits(subscription?.plan?.name || 'Starter');

  return {
    ugcCount,
    influencerCount,
    ugcLimit: limits.ugcLimit,
    influencerLimit: limits.influencerLimit,
  };
};

export const getPlanLimits = async (planName: string): Promise<PlanLimits> => {
  try {
    // Try to get plan from database first
    const plan = await prisma.plan.findUnique({
      where: { name: planName },
    });

    if (plan) {
      console.log(`✅ Found plan "${planName}" in database with limits:`, {
        ugcLimit: plan.ugcLimit,
        influencerLimit: plan.influencerLimit,
      });
      return {
        ugcLimit: plan.ugcLimit,
        influencerLimit: plan.influencerLimit,
      };
    }

    // Fallback to hardcoded limits if plan not found in database
    console.warn(`⚠️ Plan "${planName}" not found in database, using fallback limits`);
    const fallbackLimits = {
      'Starter': { ugcLimit: 5, influencerLimit: 1 },
      'Pro': { ugcLimit: 300, influencerLimit: 10 },
      'Scale': { ugcLimit: 1000, influencerLimit: 50 },
      'Enterprise': { ugcLimit: -1, influencerLimit: -1 },
    };

    return fallbackLimits[planName as keyof typeof fallbackLimits] || fallbackLimits['Starter'];
  } catch (error) {
    console.error(`❌ Error getting plan limits for "${planName}":`, error);
    
    // Emergency fallback
    return { ugcLimit: 5, influencerLimit: 1 };
  }
};

export const checkUsageLimit = async (
  merchantId: string,
  resource: 'ugc' | 'influencer'
): Promise<{ allowed: boolean; current: number; limit: number }> => {
  const usage = await getSubscriptionUsage(merchantId);
  
  const current = resource === 'ugc' ? usage.ugcCount : usage.influencerCount;
  const limit = resource === 'ugc' ? usage.ugcLimit : usage.influencerLimit;
  
  // -1 means unlimited
  const allowed = limit === -1 || current < limit;
  
  return { allowed, current, limit };
};

export const withSubscriptionGate = (
  handler: Function,
  requiredPlan: 'Starter' | 'Pro' | 'Scale' = 'Starter'
) => {
  return async (request: Request) => {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { merchantId },
      include: { plan: true },
    });

    // Allow access if subscription is active OR canceled but still within period OR pending (Enterprise)
    const now = new Date();
    const isActive = subscription?.status === 'ACTIVE';
    const isCanceledButValid = subscription?.status === 'CANCELED' && 
                               subscription?.currentPeriodEnd > now;
    const isPending = subscription?.status === 'PENDING'; // Enterprise contact submitted

    if (!subscription || (!isActive && !isCanceledButValid && !isPending)) {
      return Response.json({ error: 'No active subscription' }, { status: 403 });
    }

    const planHierarchy = { Starter: 0, Pro: 1, Scale: 2, Enterprise: 3 };
    const currentPlanLevel = planHierarchy[subscription.plan.name as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (currentPlanLevel < requiredPlanLevel) {
      return Response.json({ 
        error: 'Plan upgrade required',
        currentPlan: subscription.plan.name,
        requiredPlan 
      }, { status: 403 });
    }

    return handler(request);
  };
}; 