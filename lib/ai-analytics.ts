import { prisma } from './prisma';

export interface AIInsight {
  influencerName: string;
  performanceTrend: string;
  confidenceScore: number;
  recommendedActions: string[];
  riskFactors: string[];
  growthPotential: number;
}

export interface PredictiveMetric {
  influencerName: string;
  projectedEarnings: number;
  growthRate: number;
  churnRisk: number;
  optimalCommissionRate: number;
  recommendedStrategies: string[];
  nextMonthPrediction: number;
  seasonalAdjustment: number;
}

export interface AICodeOptimization {
  influencerId: string;
  influencerName: string;
  success: boolean;
  codes?: Record<string, unknown>[];
  error?: string;
  aiOptimization?: {
    confidenceScore: number;
    strategy: string;
    reasoning: string[];
    recommendedDiscount: number;
    recommendedUsageLimit: number;
    seasonalFactors: string[];
    marketConditions: string[];
  };
}

export async function analyzeInfluencerPerformance(influencerId: string): Promise<AIInsight> {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        discountCodes: {
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // Calculate performance metrics
    const totalCodes = influencer.discountCodes.length;
    const activeCodes = influencer.discountCodes.filter(code => code.isActive).length;
    const totalUsage = influencer.discountCodes.reduce((sum, code) => sum + code.usageCount, 0);
    const totalPayouts = influencer.payouts.filter(p => p.status === 'COMPLETED').length;
    const totalEarnings = influencer.payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate performance trend
    const recentCodes = influencer.discountCodes
      .filter(code => new Date(code.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const recentUsage = recentCodes.reduce((sum, code) => sum + code.usageCount, 0);
    const previousCodes = influencer.discountCodes
      .filter(code => new Date(code.createdAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const previousUsage = previousCodes.reduce((sum, code) => sum + code.usageCount, 0);

    const usageGrowth = previousUsage > 0 ? (recentUsage - previousUsage) / previousUsage : 0;
    
    let performanceTrend = 'stable';
    if (usageGrowth > 0.2) performanceTrend = 'growing';
    else if (usageGrowth < -0.2) performanceTrend = 'declining';

    // Calculate confidence score based on data quality
    const dataPoints = totalCodes + totalPayouts;
    const confidenceScore = Math.min(0.95, 0.3 + (dataPoints * 0.1));

    // Generate recommendations
    const recommendedActions: string[] = [];
    const riskFactors: string[] = [];

    if (totalUsage < 10) {
      recommendedActions.push('Increase marketing efforts for discount codes');
      riskFactors.push('Low engagement with discount codes');
    }

    if (usageGrowth < 0) {
      recommendedActions.push('Review and optimize discount code strategy');
      riskFactors.push('Declining performance trend');
    }

    if (influencer.commissionRate > 0.15) {
      recommendedActions.push('Consider optimizing commission rate for better margins');
    }

    if (activeCodes === 0) {
      recommendedActions.push('Generate new discount codes to maintain engagement');
      riskFactors.push('No active discount codes');
    }

    // Calculate growth potential
    const growthPotential = Math.min(1.0, 
      (confidenceScore * 0.4) + 
      (usageGrowth > 0 ? usageGrowth * 0.3 : 0) + 
      (activeCodes > 0 ? 0.2 : 0) + 
      (totalEarnings > 0 ? 0.1 : 0)
    );

    return {
      influencerName: influencer.name,
      performanceTrend,
      confidenceScore,
      recommendedActions,
      riskFactors,
      growthPotential,
    };
  } catch (error) {
    console.error('Failed to analyze influencer performance:', error);
    throw error;
  }
}

export async function generatePredictiveMetrics(influencerId: string): Promise<PredictiveMetric> {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        discountCodes: {
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // Calculate historical metrics
    const monthlyUsage = influencer.discountCodes.reduce((sum, code) => {
      const monthsSinceCreation = (Date.now() - new Date(code.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000);
      return sum + (code.usageCount / Math.max(1, monthsSinceCreation));
    }, 0);

    const averageMonthlyEarnings = influencer.payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0) / Math.max(1, influencer.payouts.length);

    // Predict next month's earnings
    const projectedEarnings = averageMonthlyEarnings * (1 + (monthlyUsage * 0.1));

    // Calculate growth rate based on recent performance
    const recentCodes = influencer.discountCodes
      .filter(code => new Date(code.createdAt) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
    const recentUsage = recentCodes.reduce((sum, code) => sum + code.usageCount, 0);
    const olderCodes = influencer.discountCodes
      .filter(code => new Date(code.createdAt) <= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
    const olderUsage = olderCodes.reduce((sum, code) => sum + code.usageCount, 0);

    const growthRate = olderUsage > 0 ? (recentUsage - olderUsage) / olderUsage : 0.1;

    // Calculate churn risk
    const daysSinceLastActivity = influencer.discountCodes.length > 0 
      ? (Date.now() - new Date(influencer.discountCodes[0].createdAt).getTime()) / (24 * 60 * 60 * 1000)
      : 999;
    
    const churnRisk = Math.min(1.0, daysSinceLastActivity / 90); // Higher risk if no activity for 90+ days

    // Calculate optimal commission rate
    const performanceScore = (monthlyUsage * 0.4) + (averageMonthlyEarnings * 0.3) + (growthRate * 0.3);
    const optimalCommissionRate = Math.max(0.05, Math.min(0.25, 0.1 + (performanceScore * 0.1)));

    // Generate recommended strategies
    const recommendedStrategies: string[] = [];
    
    if (churnRisk > 0.5) {
      recommendedStrategies.push('Implement re-engagement campaign');
    }
    
    if (growthRate < 0) {
      recommendedStrategies.push('Optimize discount code strategy');
    }
    
    if (optimalCommissionRate > influencer.commissionRate) {
      recommendedStrategies.push('Consider increasing commission rate');
    }

    // Calculate seasonal adjustment
    const currentMonth = new Date().getMonth();
    const seasonalAdjustment = 1 + (Math.sin((currentMonth / 12) * 2 * Math.PI) * 0.2); // ±20% seasonal variation

    return {
      influencerName: influencer.name,
      projectedEarnings: Math.round(projectedEarnings),
      growthRate,
      churnRisk,
      optimalCommissionRate,
      recommendedStrategies,
      nextMonthPrediction: Math.round(projectedEarnings * seasonalAdjustment),
      seasonalAdjustment,
    };
  } catch (error) {
    console.error('Failed to generate predictive metrics:', error);
    throw error;
  }
}

export async function optimizeDiscountCodes(influencerId: string): Promise<AICodeOptimization> {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        discountCodes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      return {
        influencerId,
        influencerName: 'Unknown',
        success: false,
        error: 'Influencer not found',
      };
    }

    // Analyze historical performance
    const historicalCodes = influencer.discountCodes;
    const averageUsage = historicalCodes.length > 0 
      ? historicalCodes.reduce((sum, code) => sum + code.usageCount, 0) / historicalCodes.length 
      : 0;

    const averageDiscount = historicalCodes.length > 0
      ? historicalCodes.reduce((sum, code) => sum + code.discountValue, 0) / historicalCodes.length
      : 20;

    // Calculate optimal discount value
    const performanceFactor = averageUsage / 100; // Normalize to 0-1 scale
    const recommendedDiscount = Math.max(10, Math.min(50, 
      averageDiscount * (1 + (performanceFactor * 0.3))
    ));

    // Calculate optimal usage limit
    const recommendedUsageLimit = Math.max(50, Math.min(1000, 
      Math.round(averageUsage * 1.5)
    ));

    // Generate AI reasoning
    const reasoning: string[] = [];
    
    if (performanceFactor > 0.7) {
      reasoning.push('High historical performance suggests strong audience engagement');
    } else if (performanceFactor < 0.3) {
      reasoning.push('Low historical performance indicates need for optimization');
    }

    if (averageDiscount < 15) {
      reasoning.push('Conservative discount strategy may limit reach');
    } else if (averageDiscount > 30) {
      reasoning.push('High discount rates may impact profitability');
    }

    // Consider seasonal factors
    const currentMonth = new Date().getMonth();
    const seasonalFactors: string[] = [];
    
    if (currentMonth >= 10 || currentMonth <= 1) {
      seasonalFactors.push('Holiday season - increased discount effectiveness expected');
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      seasonalFactors.push('Summer season - moderate engagement expected');
    }

    // Market conditions (simplified)
    const marketConditions: string[] = [
      'Standard market conditions',
      'Competitive landscape analysis',
      'Consumer spending patterns',
    ];

    const confidenceScore = Math.min(0.95, 
      0.5 + (historicalCodes.length * 0.05) + (performanceFactor * 0.2)
    );

    return {
      influencerId,
      influencerName: influencer.name,
      success: true,
      aiOptimization: {
        confidenceScore,
        strategy: performanceFactor > 0.5 ? 'aggressive' : 'conservative',
        reasoning,
        recommendedDiscount,
        recommendedUsageLimit,
        seasonalFactors,
        marketConditions,
      },
    };
  } catch (error) {
    console.error('Failed to optimize discount codes:', error);
    return {
      influencerId,
      influencerName: 'Unknown',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateBulkAIInsights(merchantId: string): Promise<AIInsight[]> {
  try {
    const influencers = await prisma.influencer.findMany({
      where: { merchantId },
      include: {
        discountCodes: true,
        payouts: true,
      },
    });

    const insights: AIInsight[] = [];

    for (const influencer of influencers) {
      try {
        const insight = await analyzeInfluencerPerformance(influencer.id);
        insights.push(insight);
      } catch (error) {
        console.error(`Failed to analyze influencer ${influencer.id}:`, error);
        // Add default insight for failed analysis
        insights.push({
          influencerName: influencer.name,
          performanceTrend: 'unknown',
          confidenceScore: 0,
          recommendedActions: ['Insufficient data for analysis'],
          riskFactors: ['Data quality issues'],
          growthPotential: 0,
        });
      }
    }

    return insights;
  } catch (error) {
    console.error('Failed to generate bulk AI insights:', error);
    throw error;
  }
}

export async function generateBulkPredictions(merchantId: string): Promise<PredictiveMetric[]> {
  try {
    const influencers = await prisma.influencer.findMany({
      where: { merchantId },
      include: {
        discountCodes: true,
        payouts: true,
      },
    });

    const predictions: PredictiveMetric[] = [];

    for (const influencer of influencers) {
      try {
        const prediction = await generatePredictiveMetrics(influencer.id);
        predictions.push(prediction);
      } catch (error) {
        console.error(`Failed to predict for influencer ${influencer.id}:`, error);
        // Add default prediction for failed analysis
        predictions.push({
          influencerName: influencer.name,
          projectedEarnings: 0,
          growthRate: 0,
          churnRisk: 0.5,
          optimalCommissionRate: influencer.commissionRate,
          recommendedStrategies: ['Insufficient data for prediction'],
          nextMonthPrediction: 0,
          seasonalAdjustment: 1,
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('Failed to generate bulk predictions:', error);
    throw error;
  }
} 