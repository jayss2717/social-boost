import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);

    // If no merchant ID is provided, return error
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get basic metrics one by one to avoid complex queries
    const totalUgcPosts = await prisma.ugcPost.count({ where: { merchantId } });
    const totalInfluencers = await prisma.influencer.count({ where: { merchantId, isActive: true } });
    const approvedPosts = await prisma.ugcPost.count({ 
      where: { merchantId, isApproved: true } 
    });
    const pendingApproval = await prisma.ugcPost.count({ 
      where: { merchantId, isApproved: false } 
    });

    // Calculate payout amounts
    const pendingPayouts = await prisma.payout.aggregate({
      where: { merchantId, status: 'PENDING' },
      _sum: { amount: true },
    });

    const completedPayouts = await prisma.payout.aggregate({
      where: { merchantId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    // Calculate total revenue (sum of all completed payouts)
    const totalRevenue = completedPayouts._sum.amount || 0;

    // Get engagement metrics
    const engagementData = await prisma.ugcPost.aggregate({
      where: { merchantId },
      _sum: { engagement: true },
      _count: { engagement: true },
    });

    const totalEngagement = engagementData._sum.engagement || 0;
    const engagementCount = engagementData._count.engagement || 0;
    const averageEngagement = engagementCount > 0 ? Math.round(totalEngagement / engagementCount) : 0;

    // Get recent activity (posts created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await prisma.ugcPost.count({
      where: {
        merchantId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Get top performing posts
    const topPosts = await prisma.ugcPost.findMany({
      where: { merchantId, isApproved: true },
      orderBy: { engagement: 'desc' },
      take: 3,
      include: {
        influencer: {
          select: { name: true },
        },
      },
    });

    // Get platform distribution
    const platformDistribution = await prisma.ugcPost.groupBy({
      by: ['platform'],
      where: { merchantId },
      _count: { platform: true },
    });

    const platformData = {
      INSTAGRAM: 0,
      TIKTOK: 0,
      YOUTUBE: 0,
    };

    platformDistribution.forEach((item) => {
      if (item.platform in platformData) {
        platformData[item.platform as keyof typeof platformData] = item._count.platform;
      }
    });

    return NextResponse.json({
      totalUgcPosts,
      totalInfluencers,
      approvedPosts,
      pendingApproval,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      completedPayouts: completedPayouts._sum.amount || 0,
      totalRevenue,
      averageEngagement,
      totalEngagement,
      engagementCount,
      recentActivity,
      topPosts: topPosts.map(post => ({
        id: post.id,
        platform: post.platform,
        engagement: post.engagement,
        content: post.content,
        influencerName: post.influencer?.name || 'Unknown',
        createdAt: post.createdAt.toISOString(),
      })),
      platformDistribution: platformData,
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
} 