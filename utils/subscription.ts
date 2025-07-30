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

  const limits = getPlanLimits(subscription?.plan?.name || 'Free');

  return {
    ugcCount,
    influencerCount,
    ugcLimit: limits.ugcLimit,
    influencerLimit: limits.influencerLimit,
  };
};

export const getPlanLimits = (planName: string): PlanLimits => {
  const limits = {
    Free: { ugcLimit: 20, influencerLimit: 5 },
    Pro: { ugcLimit: 1000, influencerLimit: -1 }, // -1 means unlimited
    Scale: { ugcLimit: -1, influencerLimit: -1 },
  };

  return limits[planName as keyof typeof limits] || limits.Free;
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
  requiredPlan: 'Free' | 'Pro' | 'Scale' = 'Free'
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

    if (!subscription || subscription.status !== 'ACTIVE') {
      return Response.json({ error: 'No active subscription' }, { status: 403 });
    }

    const planHierarchy = { Free: 0, Pro: 1, Scale: 2 };
    const currentPlanLevel = planHierarchy[subscription.plan.name as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan];

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