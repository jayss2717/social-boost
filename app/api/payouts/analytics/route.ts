import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '30'; // days
    const influencerId = searchParams.get('influencerId');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const whereClause: Record<string, unknown> = { 
      merchantId,
      createdAt: {
        gte: startDate,
      },
    };
    
    if (influencerId) {
      whereClause.influencerId = influencerId;
    }

    // Get payout statistics
    const payouts = await prisma.payout.findMany({
      where: whereClause,
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            commissionRate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate analytics
    const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0) / 100;
    const completedAmount = payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, payout) => sum + payout.amount, 0) / 100;
    const pendingAmount = payouts
      .filter(p => p.status === 'PENDING')
      .reduce((sum, payout) => sum + payout.amount, 0) / 100;
    const failedAmount = payouts
      .filter(p => p.status === 'FAILED')
      .reduce((sum, payout) => sum + payout.amount, 0) / 100;

    // Status breakdown
    const statusBreakdown = {
      PENDING: payouts.filter(p => p.status === 'PENDING').length,
      PROCESSING: payouts.filter(p => p.status === 'PROCESSING').length,
      COMPLETED: payouts.filter(p => p.status === 'COMPLETED').length,
      FAILED: payouts.filter(p => p.status === 'FAILED').length,
    };

    // Top influencers by payout amount
    const influencerStats = payouts.reduce((acc, payout) => {
      const influencerId = payout.influencerId;
      if (!acc[influencerId]) {
        acc[influencerId] = {
          influencer: payout.influencer,
          totalAmount: 0,
          payoutCount: 0,
          completedAmount: 0,
          pendingAmount: 0,
        };
      }
      
      acc[influencerId].totalAmount += payout.amount / 100;
      acc[influencerId].payoutCount += 1;
      
      if (payout.status === 'COMPLETED') {
        acc[influencerId].completedAmount += payout.amount / 100;
      } else if (payout.status === 'PENDING') {
        acc[influencerId].pendingAmount += payout.amount / 100;
      }
      
      return acc;
    }, {} as Record<string, {
      influencer: { id: string; name: string; email: string; commissionRate: number };
      totalAmount: number;
      payoutCount: number;
      completedAmount: number;
      pendingAmount: number;
    }>);

    const topInfluencers = Object.values(influencerStats)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Monthly trends
    const monthlyTrends = payouts.reduce((acc, payout) => {
      const month = new Date(payout.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          totalAmount: 0,
          payoutCount: 0,
          completedAmount: 0,
        };
      }
      
      acc[month].totalAmount += payout.amount / 100;
      acc[month].payoutCount += 1;
      
      if (payout.status === 'COMPLETED') {
        acc[month].completedAmount += payout.amount / 100;
      }
      
      return acc;
    }, {} as Record<string, {
      totalAmount: number;
      payoutCount: number;
      completedAmount: number;
    }>);

    // Commission calculation analysis
    const commissionAnalysis = payouts.reduce((acc, payout) => {
      const commissionRate = payout.influencer.commissionRate;
      if (!acc[commissionRate]) {
        acc[commissionRate] = {
          rate: commissionRate,
          totalAmount: 0,
          payoutCount: 0,
        };
      }
      
      acc[commissionRate].totalAmount += payout.amount / 100;
      acc[commissionRate].payoutCount += 1;
      
      return acc;
    }, {} as Record<string, {
      rate: number;
      totalAmount: number;
      payoutCount: number;
    }>);

    return createSuccessResponse({
      period: parseInt(period),
      summary: {
        totalAmount,
        completedAmount,
        pendingAmount,
        failedAmount,
        totalPayouts: payouts.length,
        completedPayouts: statusBreakdown.COMPLETED,
        pendingPayouts: statusBreakdown.PENDING,
        failedPayouts: statusBreakdown.FAILED,
      },
      statusBreakdown,
      topInfluencers,
      monthlyTrends,
      commissionAnalysis: Object.values(commissionAnalysis),
      payouts: payouts.slice(0, 50), // Recent payouts for detailed view
    });
  } catch (error) {
    console.error('Failed to fetch payout analytics:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to fetch payout analytics', 500);
  }
} 