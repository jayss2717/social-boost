import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { shop, planName } = await request.json();
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    console.log('🔍 Testing webhook plan mapping for shop:', shop);
    console.log('📋 Test plan name:', planName);

    // Test plan mapping logic
    const planNameMapping: { [key: string]: string } = {
      // Common variations
      'Pro Plan': 'Pro',
      'Pro': 'Pro',
      'Professional': 'Pro',
      'Professional Plan': 'Pro',
      'Scale Plan': 'Scale',
      'Scale': 'Scale',
      'Enterprise Plan': 'ENTERPRISE',
      'Enterprise': 'ENTERPRISE',
      'Starter Plan': 'STARTER',
      'Starter': 'STARTER',
      'Free Plan': 'STARTER',
      'Free': 'STARTER',
      // Handle case-insensitive matching
      'pro': 'Pro',
      'scale': 'Scale',
      'enterprise': 'ENTERPRISE',
      'starter': 'STARTER',
      'free': 'STARTER',
    };

    // Test the mapping logic
    let mappedPlanName = planNameMapping[planName];
    if (!mappedPlanName) {
      const lowerPlanName = planName.toLowerCase();
      mappedPlanName = planNameMapping[lowerPlanName];
    }

    if (!mappedPlanName) {
      if (planName.toLowerCase().includes('pro')) {
        mappedPlanName = 'Pro';
      } else if (planName.toLowerCase().includes('scale')) {
        mappedPlanName = 'Scale';
      } else if (planName.toLowerCase().includes('enterprise')) {
        mappedPlanName = 'ENTERPRISE';
      } else if (planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('free')) {
        mappedPlanName = 'STARTER';
      }
    }

    console.log('🔄 Plan mapping result:', {
      original: planName,
      mapped: mappedPlanName,
      success: !!mappedPlanName
    });

    // Check if plan exists in database
    let plan = null;
    if (mappedPlanName) {
      plan = await prisma.plan.findUnique({
        where: { name: mappedPlanName },
      });
    }

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: { subscription: { include: { plan: true } } },
    });

    // Get all available plans
    const allPlans = await prisma.plan.findMany();

    return NextResponse.json({
      success: true,
      test: {
        originalPlanName: planName,
        mappedPlanName,
        planFound: !!plan,
        planDetails: plan,
      },
      merchant: merchant ? {
        id: merchant.id,
        shop: merchant.shop,
        hasSubscription: !!merchant.subscription,
        currentPlan: merchant.subscription?.plan?.name,
        currentPlanId: merchant.subscription?.planId,
      } : null,
      availablePlans: allPlans.map(p => ({ id: p.id, name: p.name, priceCents: p.priceCents })),
    });

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({ error: 'Test failed', details: error }, { status: 500 });
  }
} 