import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSubscriptionUsage } from '@/utils/subscription';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    // If no merchant ID provided, return demo data for testing
    if (!merchantId) {
      const demoUsage = {
        ugcCount: 15,
        influencerCount: 3,
        ugcLimit: 20,
        influencerLimit: 5,
      };

      const plans = [
        { name: 'Free', price: 0, ugcLimit: 20, influencerLimit: 5 },
        { name: 'Pro', price: 29, ugcLimit: 1000, influencerLimit: -1 },
        { name: 'Scale', price: 99, ugcLimit: -1, influencerLimit: -1 },
      ];

      return NextResponse.json({
        usage: demoUsage,
        subscription: {
          id: 'demo',
          merchantId: 'demo',
          planId: 'free',
          status: 'ACTIVE',
          plan: { name: 'Free', price: 0, ugcLimit: 20, influencerLimit: 5 },
        },
        plans,
      });
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful for subscription');
    } catch (dbError) {
      console.error('❌ Database connection failed for subscription:', dbError);
      // Return demo data if database is unavailable
      const demoUsage = {
        ugcCount: 0,
        influencerCount: 0,
        ugcLimit: 20,
        influencerLimit: 5,
      };

      const plans = [
        { name: 'Free', price: 0, ugcLimit: 20, influencerLimit: 5 },
        { name: 'Pro', price: 29, ugcLimit: 1000, influencerLimit: -1 },
        { name: 'Scale', price: 99, ugcLimit: -1, influencerLimit: -1 },
      ];

      return NextResponse.json({
        usage: demoUsage,
        subscription: {
          id: 'demo',
          merchantId: merchantId || 'demo',
          planId: 'free',
          status: 'ACTIVE',
          plan: { name: 'Free', price: 0, ugcLimit: 20, influencerLimit: 5 },
        },
        plans,
        _note: 'Demo data - database connection failed',
      });
    }

    const [usage, subscription] = await Promise.all([
      getSubscriptionUsage(merchantId),
      prisma.subscription.findUnique({
        where: { merchantId },
        include: { plan: true },
      }),
    ]);

    const plans = [
      { name: 'Free', price: 0, ugcLimit: 20, influencerLimit: 5 },
      { name: 'Pro', price: 29, ugcLimit: 1000, influencerLimit: -1 },
      { name: 'Scale', price: 99, ugcLimit: -1, influencerLimit: -1 },
    ];

    return NextResponse.json({
      usage,
      subscription,
      plans,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 