import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export interface CommissionCalculation {
  influencerId: string;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  commissionRate: number;
  performanceMultiplier: number;
  periodStart: Date;
  periodEnd: Date;
  salesData: SalesData[];
  aiInsights: AIInsights;
  predictiveMetrics: PredictiveMetrics;
}

export interface SalesData {
  orderId: string;
  orderAmount: number;
  discountAmount: number;
  netAmount: number;
  commissionEarned: number;
  date: Date;
  customerSegment?: string;
  productCategory?: string;
  conversionSource?: string;
}

export interface PerformanceMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  customerRetentionRate: number;
  socialEngagement: number;
  customerLifetimeValue: number;
  repeatPurchaseRate: number;
  referralRate: number;
}

export interface AIInsights {
  performanceTrend: 'improving' | 'stable' | 'declining';
  recommendedActions: string[];
  riskFactors: string[];
  opportunityAreas: string[];
  confidenceScore: number;
}

export interface PredictiveMetrics {
  projectedEarnings: number;
  growthRate: number;
  churnRisk: number;
  optimalCommissionRate: number;
  recommendedStrategies: string[];
}

export interface CommissionAnalytics {
  totalPayouts: number;
  totalAmount: number;
  averagePayout: number;
  totalBonusPaid: number;
  averagePerformanceMultiplier: number;
  topPerformers: any[];
  performanceTrends: PerformanceTrend[];
  aiOptimizationStats: AIOptimizationStats;
}

export interface PerformanceTrend {
  period: string;
  totalSales: number;
  commissionEarned: number;
  performanceMultiplier: number;
  growthRate: number;
}

export interface AIOptimizationStats {
  totalAIOptimized: number;
  averageConfidenceScore: number;
  successfulPredictions: number;
  totalPredictions: number;
  accuracyRate: number;
}

export class EnhancedCommissionTracker {
  private merchantId: string;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
  }

  /**
   * Calculate comprehensive commission including AI-powered insights and predictions
   */
  async calculateEnhancedCommission(
    influencerId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CommissionCalculation> {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // Get all sales data for the period
    const salesData = await this.getSalesData(influencerId, periodStart, periodEnd);
    
    // Calculate base commission
    const baseAmount = this.calculateBaseCommission(salesData, influencer.commissionRate);
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(salesData);
    
    // Calculate performance bonus with AI insights
    const performanceMultiplier = this.calculatePerformanceMultiplier(performanceMetrics);
    const bonusAmount = baseAmount * (performanceMultiplier - 1);
    
    const totalAmount = baseAmount + bonusAmount;

    // Generate AI insights
    const aiInsights = await this.generateAIInsights(influencerId, performanceMetrics, salesData);
    
    // Generate predictive metrics
    const predictiveMetrics = await this.generatePredictiveMetrics(influencerId, performanceMetrics, salesData);

    return {
      influencerId,
      baseAmount,
      bonusAmount,
      totalAmount,
      commissionRate: influencer.commissionRate,
      performanceMultiplier,
      periodStart,
      periodEnd,
      salesData,
      aiInsights,
      predictiveMetrics,
    };
  }

  /**
   * Generate AI-powered insights for commission optimization
   */
  private async generateAIInsights(
    influencerId: string, 
    metrics: PerformanceMetrics, 
    salesData: SalesData[]
  ): Promise<AIInsights> {
    const historicalData = await this.getHistoricalPerformance(influencerId);
    const insights: AIInsights = {
      performanceTrend: 'stable',
      recommendedActions: [],
      riskFactors: [],
      opportunityAreas: [],
      confidenceScore: 0.8,
    };

    // Analyze performance trend
    if (historicalData.length >= 2) {
      const currentPeriod = metrics.totalSales;
      const previousPeriod = historicalData[historicalData.length - 1].totalSales;
      const growthRate = (currentPeriod - previousPeriod) / previousPeriod;

      if (growthRate > 0.1) {
        insights.performanceTrend = 'improving';
        insights.recommendedActions.push('Consider increasing commission rate for retention');
        insights.recommendedActions.push('Expand influencer collaboration opportunities');
      } else if (growthRate < -0.1) {
        insights.performanceTrend = 'declining';
        insights.riskFactors.push('Declining performance may indicate engagement issues');
        insights.recommendedActions.push('Review influencer content strategy');
        insights.recommendedActions.push('Consider performance improvement incentives');
      }
    }

    // Analyze customer retention
    if (metrics.customerRetentionRate < 0.6) {
      insights.riskFactors.push('Low customer retention rate');
      insights.recommendedActions.push('Implement customer retention strategies');
      insights.confidenceScore -= 0.1;
    }

    // Analyze conversion rate
    if (metrics.conversionRate > 0.8) {
      insights.opportunityAreas.push('High conversion rate - consider premium positioning');
      insights.recommendedActions.push('Explore higher-value product collaborations');
    } else if (metrics.conversionRate < 0.4) {
      insights.riskFactors.push('Low conversion rate');
      insights.recommendedActions.push('Optimize content for better conversion');
    }

    // Analyze social engagement
    if (metrics.socialEngagement > 1000) {
      insights.opportunityAreas.push('High social engagement - leverage for brand awareness');
      insights.recommendedActions.push('Increase social media collaboration');
    }

    // Analyze average order value
    if (metrics.averageOrderValue > 150) {
      insights.opportunityAreas.push('High average order value - premium positioning opportunity');
      insights.recommendedActions.push('Focus on high-value product promotions');
    }

    return insights;
  }

  /**
   * Generate predictive metrics for future performance
   */
  private async generatePredictiveMetrics(
    influencerId: string,
    metrics: PerformanceMetrics,
    salesData: SalesData[]
  ): Promise<PredictiveMetrics> {
    const historicalData = await this.getHistoricalPerformance(influencerId);
    
    // Calculate growth rate
    let growthRate = 0;
    if (historicalData.length >= 2) {
      const currentPeriod = metrics.totalSales;
      const previousPeriod = historicalData[historicalData.length - 1].totalSales;
      growthRate = (currentPeriod - previousPeriod) / previousPeriod;
    }

    // Project future earnings
    const projectedEarnings = metrics.totalSales * (1 + growthRate) * metrics.conversionRate;

    // Calculate churn risk
    let churnRisk = 0.1; // Base risk
    if (metrics.customerRetentionRate < 0.5) churnRisk += 0.3;
    if (metrics.conversionRate < 0.3) churnRisk += 0.2;
    if (metrics.socialEngagement < 100) churnRisk += 0.1;

    // Calculate optimal commission rate
    let optimalCommissionRate = 0.1; // Base 10%
    if (metrics.conversionRate > 0.8) optimalCommissionRate += 0.02;
    if (metrics.customerRetentionRate > 0.8) optimalCommissionRate += 0.02;
    if (metrics.averageOrderValue > 200) optimalCommissionRate += 0.01;

    // Generate recommended strategies
    const recommendedStrategies: string[] = [];
    if (metrics.conversionRate > 0.7) {
      recommendedStrategies.push('Focus on high-converting content formats');
    }
    if (metrics.customerRetentionRate < 0.6) {
      recommendedStrategies.push('Implement customer retention programs');
    }
    if (metrics.socialEngagement > 1000) {
      recommendedStrategies.push('Leverage social media for brand awareness');
    }

    return {
      projectedEarnings,
      growthRate,
      churnRisk,
      optimalCommissionRate,
      recommendedStrategies,
    };
  }

  /**
   * Get historical performance data
   */
  private async getHistoricalPerformance(influencerId: string) {
    const payouts = await prisma.payout.findMany({
      where: { influencerId },
      include: { commissionPerformance: true },
      orderBy: { createdAt: 'desc' },
      take: 6, // Last 6 periods
    });

    return payouts.map(payout => ({
      period: payout.periodStart.toISOString().split('T')[0],
      totalSales: payout.commissionPerformance?.totalSales || 0,
      commissionEarned: payout.amount,
      performanceMultiplier: payout.commissionPerformance?.performanceMultiplier || 1,
    }));
  }

  /**
   * Get sales data from discount code usage with enhanced analytics
   */
  private async getSalesData(influencerId: string, periodStart: Date, periodEnd: Date): Promise<SalesData[]> {
    const discountCodes = await prisma.discountCode.findMany({
      where: {
        influencerId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        ugcPost: true,
      },
    });

    const salesData: SalesData[] = [];

    for (const code of discountCodes) {
      if (code.usageCount > 0) {
        // Enhanced order amount estimation with customer segmentation
        const estimatedOrderAmount = code.discountType === 'PERCENTAGE' 
          ? (code.discountValue / 100) * 120 // Assume $120 average order for percentage discounts
          : code.discountValue * 2.5; // Assume 2.5x discount value for fixed amounts

        const orderAmount = estimatedOrderAmount * code.usageCount;
        const discountAmount = code.discountValue * code.usageCount;
        const netAmount = orderAmount - discountAmount;
        const commissionEarned = netAmount * 0.1; // Default 10% commission rate

        // Enhanced customer segmentation
        let customerSegment = 'standard';
        if (estimatedOrderAmount > 200) customerSegment = 'premium';
        else if (estimatedOrderAmount < 50) customerSegment = 'budget';

        // Product category estimation
        let productCategory = 'general';
        if (code.ugcPost) {
          // Analyze UGC content for product category hints
          const content = code.ugcPost.content?.toLowerCase() || '';
          if (content.includes('clothing') || content.includes('fashion')) productCategory = 'fashion';
          else if (content.includes('beauty') || content.includes('makeup')) productCategory = 'beauty';
          else if (content.includes('tech') || content.includes('electronics')) productCategory = 'electronics';
        }

        // Conversion source
        let conversionSource = 'social_media';
        if (code.ugcPost) {
          conversionSource = code.ugcPost.platform.toLowerCase();
        }

        salesData.push({
          orderId: `estimated-${code.id}`,
          orderAmount,
          discountAmount,
          netAmount,
          commissionEarned,
          date: code.createdAt,
          customerSegment,
          productCategory,
          conversionSource,
        });
      }
    }

    return salesData;
  }

  /**
   * Calculate base commission from sales data
   */
  private calculateBaseCommission(salesData: SalesData[], commissionRate: number): number {
    const totalNetSales = salesData.reduce((sum, sale) => sum + sale.netAmount, 0);
    return Math.round(totalNetSales * commissionRate);
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private calculatePerformanceMetrics(salesData: SalesData[]): PerformanceMetrics {
    const totalSales = salesData.reduce((sum, sale) => sum + sale.orderAmount, 0);
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Calculate conversion rate (simplified)
    const conversionRate = totalOrders > 0 ? Math.min(0.8, totalOrders / 100) : 0;
    
    // Calculate customer retention (simplified)
    const uniqueCustomers = new Set(salesData.map(sale => sale.orderId)).size;
    const customerRetentionRate = uniqueCustomers > 0 ? Math.min(0.9, uniqueCustomers / totalOrders) : 0;
    
    // Calculate social engagement (based on UGC posts)
    const socialEngagement = salesData.filter(sale => sale.orderId.includes('ugc')).length;

    // Calculate customer lifetime value
    const customerLifetimeValue = averageOrderValue * 2.5; // Assume 2.5x multiplier

    // Calculate repeat purchase rate
    const repeatPurchaseRate = customerRetentionRate * 0.7; // Simplified calculation

    // Calculate referral rate
    const referralRate = Math.min(0.15, socialEngagement / totalOrders); // Based on social engagement

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      conversionRate,
      customerRetentionRate,
      socialEngagement,
      customerLifetimeValue,
      repeatPurchaseRate,
      referralRate,
    };
  }

  /**
   * Calculate performance multiplier based on comprehensive metrics
   */
  private calculatePerformanceMultiplier(metrics: PerformanceMetrics): number {
    let multiplier = 1.0;

    // Bonus for high average order value
    if (metrics.averageOrderValue > 150) {
      multiplier += 0.1;
    } else if (metrics.averageOrderValue > 100) {
      multiplier += 0.05;
    }

    // Bonus for high conversion rate
    if (metrics.conversionRate > 0.6) {
      multiplier += 0.15;
    } else if (metrics.conversionRate > 0.4) {
      multiplier += 0.1;
    }

    // Bonus for customer retention
    if (metrics.customerRetentionRate > 0.7) {
      multiplier += 0.1;
    }

    // Bonus for social engagement
    if (metrics.socialEngagement > 5) {
      multiplier += 0.2;
    } else if (metrics.socialEngagement > 2) {
      multiplier += 0.1;
    }

    // Bonus for customer lifetime value
    if (metrics.customerLifetimeValue > 300) {
      multiplier += 0.1;
    }

    // Bonus for repeat purchase rate
    if (metrics.repeatPurchaseRate > 0.5) {
      multiplier += 0.1;
    }

    // Bonus for referral rate
    if (metrics.referralRate > 0.1) {
      multiplier += 0.15;
    }

    // Cap multiplier at 2.0
    return Math.min(2.0, multiplier);
  }

  /**
   * Create enhanced payout record with AI insights and predictive data
   */
  async createEnhancedPayout(calculation: CommissionCalculation) {
    const payout = await prisma.payout.create({
      data: {
        merchantId: this.merchantId,
        influencerId: calculation.influencerId,
        amount: calculation.totalAmount,
        status: 'PENDING',
        periodStart: calculation.periodStart,
        periodEnd: calculation.periodEnd,
      },
      include: { influencer: true },
    });

    // Store comprehensive performance data for analytics
    await prisma.commissionPerformance.create({
      data: {
        payoutId: payout.id,
        baseAmount: calculation.baseAmount,
        bonusAmount: calculation.bonusAmount,
        performanceMultiplier: calculation.performanceMultiplier,
        totalSales: calculation.salesData.reduce((sum, sale) => sum + sale.orderAmount, 0),
        totalOrders: calculation.salesData.length,
        averageOrderValue: calculation.salesData.length > 0 
          ? calculation.salesData.reduce((sum, sale) => sum + sale.orderAmount, 0) / calculation.salesData.length 
          : 0,
      },
    });

    // Store AI insights and predictions
    await prisma.commissionInsights.create({
      data: {
        payoutId: payout.id,
        performanceTrend: calculation.aiInsights.performanceTrend,
        recommendedActions: calculation.aiInsights.recommendedActions,
        riskFactors: calculation.aiInsights.riskFactors,
        opportunityAreas: calculation.aiInsights.opportunityAreas,
        confidenceScore: calculation.aiInsights.confidenceScore,
        projectedEarnings: calculation.predictiveMetrics.projectedEarnings,
        growthRate: calculation.predictiveMetrics.growthRate,
        churnRisk: calculation.predictiveMetrics.churnRisk,
        optimalCommissionRate: calculation.predictiveMetrics.optimalCommissionRate,
        recommendedStrategies: calculation.predictiveMetrics.recommendedStrategies,
      },
    });

    return payout;
  }

  /**
   * Process automated payouts with AI-powered decision making
   */
  async processAutomatedPayouts() {
    const influencers = await prisma.influencer.findMany({
      where: { 
        merchantId: this.merchantId,
        isActive: true,
      },
    });

    const results = [];

    for (const influencer of influencers) {
      try {
        // Calculate commission for the last 30 days
        const periodEnd = new Date();
        const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

        const calculation = await this.calculateEnhancedCommission(
          influencer.id,
          periodStart,
          periodEnd
        );

        // AI-powered payout decision
        const shouldProcess = this.shouldProcessPayout(calculation);

        if (shouldProcess) {
          const payout = await this.createEnhancedPayout(calculation);
          
          // Auto-process if high performer or low risk
          if (calculation.aiInsights.confidenceScore > 0.8 && calculation.predictiveMetrics.churnRisk < 0.3) {
            await this.processPayoutViaStripe(payout.id);
          }

          results.push({
            influencerId: influencer.id,
            influencerName: influencer.name,
            success: true,
            amount: calculation.totalAmount,
            performanceMultiplier: calculation.performanceMultiplier,
            aiConfidenceScore: calculation.aiInsights.confidenceScore,
            churnRisk: calculation.predictiveMetrics.churnRisk,
            autoProcessed: calculation.aiInsights.confidenceScore > 0.8 && calculation.predictiveMetrics.churnRisk < 0.3,
          });
        }
      } catch (error) {
        results.push({
          influencerId: influencer.id,
          influencerName: influencer.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * AI-powered decision making for payout processing
   */
  private shouldProcessPayout(calculation: CommissionCalculation): boolean {
    // Minimum threshold
    if (calculation.totalAmount < 500) return false; // $5 minimum

    // Risk assessment
    if (calculation.predictiveMetrics.churnRisk > 0.7) return false;

    // Performance assessment
    if (calculation.performanceMultiplier < 0.8) return false;

    // AI confidence assessment
    if (calculation.aiInsights.confidenceScore < 0.6) return false;

    return true;
  }

  /**
   * Process payout via Stripe
   */
  private async processPayoutViaStripe(payoutId: string) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { influencer: true },
    });

    if (!payout || !payout.influencer.stripeAccountId) {
      throw new Error('Payout not found or influencer has no Stripe account');
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: payout.amount,
        currency: 'usd',
        destination: payout.influencer.stripeAccountId,
        description: `Enhanced commission payout for ${payout.influencer.name}`,
        metadata: {
          payoutId: payout.id,
          influencerId: payout.influencerId,
          merchantId: payout.merchantId,
          enhanced: 'true',
        },
      });

      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          stripeTransferId: transfer.id,
        },
      });

      return transfer;
    } catch (error) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  /**
   * Get comprehensive commission analytics with AI insights
   */
  async getCommissionAnalytics(influencerId?: string): Promise<CommissionAnalytics> {
    const whereClause = influencerId 
      ? { influencerId, merchantId: this.merchantId }
      : { merchantId: this.merchantId };

    const payouts = await prisma.payout.findMany({
      where: whereClause,
      include: { 
        influencer: true,
        commissionPerformance: true,
        commissionInsights: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate performance trends
    const performanceTrends: PerformanceTrend[] = payouts.slice(0, 6).map((payout, index) => {
      const previousPayout = payouts[index + 1];
      const growthRate = previousPayout 
        ? (payout.amount - previousPayout.amount) / previousPayout.amount
        : 0;

      return {
        period: payout.periodStart.toISOString().split('T')[0],
        totalSales: payout.commissionPerformance?.totalSales || 0,
        commissionEarned: payout.amount,
        performanceMultiplier: payout.commissionPerformance?.performanceMultiplier || 1,
        growthRate,
      };
    });

    // Calculate AI optimization stats
    const aiOptimizationStats: AIOptimizationStats = {
      totalAIOptimized: payouts.filter(p => p.commissionInsights).length,
      averageConfidenceScore: payouts.length > 0 
        ? payouts.reduce((sum, p) => sum + (p.commissionInsights?.confidenceScore || 0), 0) / payouts.length 
        : 0,
      successfulPredictions: payouts.filter(p => p.commissionInsights?.projectedEarnings && 
        Math.abs(p.amount - p.commissionInsights.projectedEarnings) / p.amount < 0.2).length,
      totalPredictions: payouts.filter(p => p.commissionInsights?.projectedEarnings).length,
      accuracyRate: 0,
    };

    if (aiOptimizationStats.totalPredictions > 0) {
      aiOptimizationStats.accuracyRate = aiOptimizationStats.successfulPredictions / aiOptimizationStats.totalPredictions;
    }

    const analytics: CommissionAnalytics = {
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
      averagePayout: payouts.length > 0 ? payouts.reduce((sum, p) => sum + p.amount, 0) / payouts.length : 0,
      totalBonusPaid: payouts.reduce((sum, p) => sum + (p.commissionPerformance?.bonusAmount || 0), 0),
      averagePerformanceMultiplier: payouts.length > 0 
        ? payouts.reduce((sum, p) => sum + (p.commissionPerformance?.performanceMultiplier || 1), 0) / payouts.length 
        : 1,
      topPerformers: payouts
        .filter(p => (p.commissionPerformance?.performanceMultiplier || 1) > 1.2)
        .sort((a, b) => (b.commissionPerformance?.performanceMultiplier || 1) - (a.commissionPerformance?.performanceMultiplier || 1))
        .slice(0, 5)
        .map(payout => ({
          influencer: payout.influencer.name,
          amount: payout.amount,
          multiplier: payout.commissionPerformance?.performanceMultiplier || 1,
          bonus: payout.commissionPerformance?.bonusAmount || 0,
          aiConfidence: payout.commissionInsights?.confidenceScore || 0,
        })),
      performanceTrends,
      aiOptimizationStats,
    };

    return analytics;
  }
} 