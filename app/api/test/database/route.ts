import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test basic queries
    const merchantCount = await prisma.merchant.count();
    const planCount = await prisma.plan.count();
    const subscriptionCount = await prisma.subscription.count();
    const influencerCount = await prisma.influencer.count();
    const ugcPostCount = await prisma.ugcPost.count();
    const payoutCount = await prisma.payout.count();

    // Test schema by checking if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('merchants', 'plans', 'subscriptions', 'influencers', 'ugc_posts', 'payouts')
      ORDER BY table_name
    `;

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      connection: 'Connected to PostgreSQL',
      schema: {
        tables: tables,
        counts: {
          merchants: merchantCount,
          plans: planCount,
          subscriptions: subscriptionCount,
          influencers: influencerCount,
          ugcPosts: ugcPostCount,
          payouts: payoutCount,
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 