'use client';

import { Card, Text, Badge, ProgressBar, Button, Modal, BlockStack } from '@shopify/polaris';
import { TrendingUp, DollarSign, Users, Gift, Target, Award, Brain, BarChart3, AlertTriangle, Zap } from 'lucide-react';
import { useState } from 'react';

interface InfluencerAnalyticsProps {
  influencers: {
    id: string;
    name: string;
    email?: string;
    instagramHandle?: string;
    tiktokHandle?: string;
    commissionRate: number;
    isActive: boolean;
    discountCodes: Array<{
      id: string;
      code: string;
      discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
      discountValue: number;
      usageLimit: number;
      usageCount: number;
      isActive: boolean;
      expiresAt: string;
      uniqueLink: string;
      aiOptimized?: boolean;
    }>;
  }[];
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
  discountCodes: Array<{
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    usageLimit: number;
    usageCount: number;
    isActive: boolean;
    expiresAt: string;
    uniqueLink: string;
    aiOptimized?: boolean;
    influencerId?: string;
  }>;
  aiInsights?: Array<{
    influencerName: string;
    performanceTrend: string;
    confidenceScore: number;
    recommendedActions: string[];
  }>;
  predictiveMetrics?: Array<{
    influencerName: string;
    projectedEarnings: number;
    growthRate: number;
    churnRisk: number;
    optimalCommissionRate: number;
    recommendedStrategies: string[];
  }>;
}

export function InfluencerAnalytics({ 
  influencers, 
  payouts, 
  discountCodes, 
  aiInsights = [], 
  predictiveMetrics = [] 
}: InfluencerAnalyticsProps) {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  const activeInfluencers = influencers.filter(inf => inf.isActive).length;
  const totalPayouts = payouts.length;
  const completedPayouts = payouts.filter(p => p.status === 'COMPLETED').length;
  const pendingPayouts = payouts.filter(p => p.status === 'PENDING').length;

  const totalCommissionPaid = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCommissionPending = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDiscountCodes = discountCodes.length;
  const activeDiscountCodes = discountCodes.filter(code => code.isActive).length;
  const totalUsage = discountCodes.reduce((sum, code) => sum + code.usageCount, 0);

  // Performance metrics
  const averageCommissionRate = influencers.length > 0 
    ? influencers.reduce((sum, inf) => sum + inf.commissionRate, 0) / influencers.length 
    : 0;

  const topPerformers = influencers
    .map(influencer => {
      const influencerCodes = discountCodes.filter(code => code.influencerId === influencer.id);
      const totalUsage = influencerCodes.reduce((sum, code) => sum + code.usageCount, 0);
      const totalRevenue = influencerCodes.reduce((sum, code) => sum + (code.usageCount * code.discountValue), 0);
      
      return {
        ...influencer,
        totalUsage,
        totalRevenue,
        performanceScore: totalUsage * influencer.commissionRate
      };
    })
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 5);

  const platformBreakdown = influencers.reduce((acc, influencer) => {
    if (influencer.instagramHandle) acc.instagram++;
    if (influencer.tiktokHandle) acc.tiktok++;
    return acc;
  }, { instagram: 0, tiktok: 0 });

  const commissionTiers = influencers.reduce((acc, influencer) => {
    if (influencer.commissionRate >= 0.15) acc.high++;
    else if (influencer.commissionRate >= 0.10) acc.medium++;
    else acc.low++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  // AI Analytics
  const aiOptimizedCodes = discountCodes.filter(code => code.aiOptimized).length;
  const averageConfidenceScore = aiInsights.length > 0 
    ? aiInsights.reduce((sum, insight) => sum + insight.confidenceScore, 0) / aiInsights.length 
    : 0;

  const highRiskInfluencers = predictiveMetrics.filter(metric => metric.churnRisk > 0.5).length;
  const highGrowthInfluencers = predictiveMetrics.filter(metric => metric.growthRate > 0.2).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* AI-Powered Analytics Header */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Text variant="headingMd" as="h3">
              AI-Powered Influencer Analytics
            </Text>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                size="slim"
                variant="secondary"
                onClick={() => setShowAIInsights(true)}
                icon={() => <Brain className="w-4 h-4" />}
              >
                AI Insights
              </Button>
              <Button
                size="slim"
                variant="secondary"
                onClick={() => setShowPredictions(true)}
                icon={() => <BarChart3 className="w-4 h-4" />}
              >
                Predictions
              </Button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {aiOptimizedCodes}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                AI-Optimized Codes
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {(averageConfidenceScore * 100).toFixed(1)}%
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                AI Confidence
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="critical">
                {highRiskInfluencers}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                High Risk
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {highGrowthInfluencers}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                High Growth
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            Influencer Performance Overview
          </Text>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {activeInfluencers}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Active Influencers
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                ${(totalCommissionPaid / 100).toFixed(2)}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Total Paid
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="critical">
                ${(totalCommissionPending / 100).toFixed(2)}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Pending Payouts
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {totalUsage}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Total Code Usage
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {(averageCommissionRate * 100).toFixed(1)}%
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Avg Commission Rate
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Commission Tracking */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            Commission Tracking
          </Text>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Text variant="bodyMd" as="p">Completed Payouts</Text>
              <Text variant="bodyMd" as="p">{completedPayouts}</Text>
            </div>
            <ProgressBar 
              progress={totalPayouts > 0 ? (completedPayouts / totalPayouts) * 100 : 0} 
              tone="success" 
              size="small" 
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Text variant="bodyMd" as="p">Pending Payouts</Text>
              <Text variant="bodyMd" as="p">{pendingPayouts}</Text>
            </div>
            <ProgressBar 
              progress={totalPayouts > 0 ? (pendingPayouts / totalPayouts) * 100 : 0} 
              tone="critical" 
              size="small" 
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <Text variant="bodyMd" as="p">Active Discount Codes</Text>
              <Text variant="bodyMd" as="p">{activeDiscountCodes}</Text>
            </div>
            <ProgressBar 
              progress={totalDiscountCodes > 0 ? (activeDiscountCodes / totalDiscountCodes) * 100 : 0} 
              tone="success" 
              size="small" 
            />
          </div>
        </div>
      </Card>

      {/* Top Performers */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            Top Performing Influencers
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {topPerformers.map((influencer, index) => (
              <div key={influencer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award className="w-4 h-4" />
                  <Text variant="bodyMd" as="p">{influencer.name}</Text>
                  {index < 3 && <Badge tone="success">{`#${index + 1}`}</Badge>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Text variant="bodySm" as="p">{influencer.totalUsage} uses</Text>
                  <Badge tone="success">{`$${(influencer.totalRevenue / 100).toFixed(2)}`}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Platform Distribution */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            Platform Distribution
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users className="w-4 h-4" />
                <Text variant="bodyMd" as="p">Instagram</Text>
              </div>
                              <Badge tone="success">{`${platformBreakdown.instagram}`}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users className="w-4 h-4" />
                <Text variant="bodyMd" as="p">TikTok</Text>
              </div>
                              <Badge tone="success">{`${platformBreakdown.tiktok}`}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Commission Tiers */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            Commission Rate Distribution
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target className="w-4 h-4" />
                <Text variant="bodyMd" as="p">High (15%+)</Text>
              </div>
              <Badge tone="success">{`${commissionTiers.high}`}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target className="w-4 h-4" />
                <Text variant="bodyMd" as="p">Medium (10-15%)</Text>
              </div>
              <Badge tone="warning">{`${commissionTiers.medium}`}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target className="w-4 h-4" />
                <Text variant="bodyMd" as="p">Low (&lt;10%)</Text>
              </div>
              <Badge tone="critical">{`${commissionTiers.low}`}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            AI-Powered Performance Insights
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {activeInfluencers > 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <Text variant="bodyMd" as="p">
                  Strong influencer network with {activeInfluencers} active partners.
                </Text>
              </div>
            )}
            
            {totalCommissionPaid > 10000 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign className="w-4 h-4 text-green-600" />
                <Text variant="bodyMd" as="p">
                  High commission payout indicates successful influencer partnerships.
                </Text>
              </div>
            )}
            
            {totalUsage > 1000 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift className="w-4 h-4 text-green-600" />
                <Text variant="bodyMd" as="p">
                  Excellent discount code usage with {totalUsage} total redemptions.
                </Text>
              </div>
            )}
            
            {pendingPayouts > 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign className="w-4 h-4 text-orange-600" />
                <Text variant="bodyMd" as="p">
                  {pendingPayouts} payouts pending. Consider batch processing.
                </Text>
              </div>
            )}
            
            {averageCommissionRate > 0.12 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target className="w-4 h-4 text-orange-600" />
                <Text variant="bodyMd" as="p">
                  High average commission rate. Consider optimizing for better margins.
                </Text>
              </div>
            )}

            {aiOptimizedCodes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain className="w-4 h-4 text-blue-600" />
                <Text variant="bodyMd" as="p">
                  {aiOptimizedCodes} AI-optimized codes generated with {(averageConfidenceScore * 100).toFixed(1)}% confidence.
                </Text>
              </div>
            )}

            {highRiskInfluencers > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <Text variant="bodyMd" as="p">
                  {highRiskInfluencers} influencers identified as high churn risk. Consider intervention strategies.
                </Text>
              </div>
            )}

            {highGrowthInfluencers > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap className="w-4 h-4 text-green-600" />
                <Text variant="bodyMd" as="p">
                  {highGrowthInfluencers} influencers showing high growth potential. Consider increased investment.
                </Text>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* AI Insights Modal */}
      <Modal
        open={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        title="AI-Powered Insights"
        primaryAction={{
          content: 'Close',
          onAction: () => setShowAIInsights(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              AI analysis of influencer performance and recommendations:
            </Text>
            
            {aiInsights.map((insight, index) => (
              <div key={index} style={{ padding: '1rem', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
                <Text variant="bodyMd" as="p" fontWeight="bold">
                  {insight.influencerName}
                </Text>
                <Text variant="bodySm" as="p">
                  Performance Trend: {insight.performanceTrend}
                </Text>
                <Text variant="bodySm" as="p">
                  Confidence Score: {(insight.confidenceScore * 100).toFixed(1)}%
                </Text>
                {insight.recommendedActions.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Text variant="bodySm" as="p" fontWeight="bold">
                      Recommended Actions:
                    </Text>
                    {insight.recommendedActions.map((action: string, i: number) => (
                      <Text key={i} variant="bodySm" as="p" tone="subdued">
                        • {action}
                      </Text>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Predictions Modal */}
      <Modal
        open={showPredictions}
        onClose={() => setShowPredictions(false)}
        title="Predictive Analytics"
        primaryAction={{
          content: 'Close',
          onAction: () => setShowPredictions(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              AI-powered predictions for influencer performance:
            </Text>
            
            {predictiveMetrics.map((metric, index) => (
              <div key={index} style={{ padding: '1rem', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
                <Text variant="bodyMd" as="p" fontWeight="bold">
                  {metric.influencerName}
                </Text>
                <Text variant="bodySm" as="p">
                  Projected Earnings: ${(metric.projectedEarnings / 100).toFixed(2)}
                </Text>
                <Text variant="bodySm" as="p">
                  Growth Rate: {(metric.growthRate * 100).toFixed(1)}%
                </Text>
                <Text variant="bodySm" as="p">
                  Churn Risk: {(metric.churnRisk * 100).toFixed(1)}%
                </Text>
                <Text variant="bodySm" as="p">
                  Optimal Commission Rate: {(metric.optimalCommissionRate * 100).toFixed(1)}%
                </Text>
                {metric.recommendedStrategies.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Text variant="bodySm" as="p" fontWeight="bold">
                      Recommended Strategies:
                    </Text>
                    {metric.recommendedStrategies.map((strategy: string, i: number) => (
                      <Text key={i} variant="bodySm" as="p" tone="subdued">
                        • {strategy}
                      </Text>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </div>
  );
} 