import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/utils/subscription';

export async function GET() {
  try {
    console.log('🧪 Testing plan functionality...');

    // Get all plans from database
    const plans = await prisma.plan.findMany({
      orderBy: { name: 'asc' },
    });

    console.log('📋 Plans in database:', plans.map(p => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      ugcLimit: p.ugcLimit,
      influencerLimit: p.influencerLimit,
    })));

    // Test getPlanLimits function for each plan
    const planTests = [];
    for (const plan of plans) {
      try {
        const limits = await getPlanLimits(plan.name);
        planTests.push({
          planName: plan.name,
          databaseLimits: {
            ugcLimit: plan.ugcLimit,
            influencerLimit: plan.influencerLimit,
          },
          functionLimits: limits,
          match: plan.ugcLimit === limits.ugcLimit && plan.influencerLimit === limits.influencerLimit,
        });
      } catch (error) {
        planTests.push({
          planName: plan.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Test subscription usage calculation
    const testMerchantId = 'test-merchant-id';
    const testUsage = await prisma.ugcPost.count({ where: { merchantId: testMerchantId } });
    const testInfluencerCount = await prisma.influencer.count({ where: { merchantId: testMerchantId } });

    return NextResponse.json({
      success: true,
      message: 'Plan functionality test completed',
      databasePlans: plans.map(p => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        ugcLimit: p.ugcLimit,
        influencerLimit: p.influencerLimit,
      })),
      planTests,
      testUsage: {
        ugcCount: testUsage,
        influencerCount: testInfluencerCount,
      },
    });
  } catch (error) {
    console.error('❌ Plan test error:', error);
    return NextResponse.json({ 
      error: 'Plan test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 