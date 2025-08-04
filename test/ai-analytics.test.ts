import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET } from '../app/api/analytics/ai-insights/route';
import { 
  analyzeInfluencerPerformance,
  generatePredictiveMetrics,
  optimizeDiscountCodes,
  generateBulkAIInsights,
  generateBulkPredictions 
} from '../lib/ai-analytics';
import { prisma } from '../lib/prisma';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    influencer: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('../lib/auth', () => ({
  requireMerchantId: vi.fn(() => 'test-merchant-id'),
}));

describe('AI Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeInfluencerPerformance', () => {
    it('should analyze influencer performance correctly', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'Test Influencer',
        commissionRate: 0.1,
        discountCodes: [
          {
            id: 'code-1',
            usageCount: 50,
            isActive: true,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          },
          {
            id: 'code-2',
            usageCount: 30,
            isActive: true,
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          },
        ],
        payouts: [
          {
            id: 'payout-1',
            amount: 1000,
            status: 'COMPLETED',
          },
        ],
      };

      (prisma.influencer.findUnique as any).mockResolvedValue(mockInfluencer);

      const insight = await analyzeInfluencerPerformance('test-influencer-id');

      expect(insight.influencerName).toBe('Test Influencer');
      expect(insight.performanceTrend).toBe('growing');
      expect(insight.confidenceScore).toBeGreaterThan(0);
      expect(insight.recommendedActions).toBeInstanceOf(Array);
      expect(insight.riskFactors).toBeInstanceOf(Array);
      expect(insight.growthPotential).toBeGreaterThan(0);
    });

    it('should handle influencer with no activity', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'Inactive Influencer',
        commissionRate: 0.1,
        discountCodes: [],
        payouts: [],
      };

      (prisma.influencer.findUnique as any).mockResolvedValue(mockInfluencer);

      const insight = await analyzeInfluencerPerformance('test-influencer-id');

      expect(insight.influencerName).toBe('Inactive Influencer');
      expect(insight.performanceTrend).toBe('stable');
      expect(insight.confidenceScore).toBeLessThan(0.5);
      expect(insight.riskFactors).toContain('Low engagement with discount codes');
    });

    it('should throw error for non-existent influencer', async () => {
      (prisma.influencer.findUnique as any).mockResolvedValue(null);

      await expect(analyzeInfluencerPerformance('non-existent-id')).rejects.toThrow('Influencer not found');
    });
  });

  describe('generatePredictiveMetrics', () => {
    it('should generate accurate predictions', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'Test Influencer',
        commissionRate: 0.1,
        discountCodes: [
          {
            id: 'code-1',
            usageCount: 100,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        ],
        payouts: [
          {
            id: 'payout-1',
            amount: 2000,
            status: 'COMPLETED',
          },
        ],
      };

      (prisma.influencer.findUnique as any).mockResolvedValue(mockInfluencer);

      const prediction = await generatePredictiveMetrics('test-influencer-id');

      expect(prediction.influencerName).toBe('Test Influencer');
      expect(prediction.projectedEarnings).toBeGreaterThan(0);
      expect(prediction.growthRate).toBeGreaterThanOrEqual(0);
      expect(prediction.churnRisk).toBeGreaterThanOrEqual(0);
      expect(prediction.churnRisk).toBeLessThanOrEqual(1);
      expect(prediction.optimalCommissionRate).toBeGreaterThan(0);
      expect(prediction.recommendedStrategies).toBeInstanceOf(Array);
    });

    it('should handle high churn risk influencers', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'High Risk Influencer',
        commissionRate: 0.1,
        discountCodes: [
          {
            id: 'code-1',
            usageCount: 5,
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
          },
        ],
        payouts: [],
      };

      (prisma.influencer.findUnique as any).mockResolvedValue(mockInfluencer);

      const prediction = await generatePredictiveMetrics('test-influencer-id');

      expect(prediction.churnRisk).toBeGreaterThan(0.5);
      expect(prediction.recommendedStrategies).toContain('Implement re-engagement campaign');
    });
  });

  describe('optimizeDiscountCodes', () => {
    it('should optimize discount codes based on performance', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'Test Influencer',
        discountCodes: [
          {
            id: 'code-1',
            usageCount: 80,
            discountValue: 20,
          },
          {
            id: 'code-2',
            usageCount: 60,
            discountValue: 15,
          },
        ],
      };

      (prisma.influencer.findUnique as any).mockResolvedValue(mockInfluencer);

      const optimization = await optimizeDiscountCodes('test-influencer-id');

      expect(optimization.success).toBe(true);
      expect(optimization.influencerName).toBe('Test Influencer');
      expect(optimization.aiOptimization).toBeDefined();
      expect(optimization.aiOptimization?.confidenceScore).toBeGreaterThan(0);
      expect(optimization.aiOptimization?.recommendedDiscount).toBeGreaterThan(0);
      expect(optimization.aiOptimization?.recommendedUsageLimit).toBeGreaterThan(0);
      expect(optimization.aiOptimization?.reasoning).toBeInstanceOf(Array);
    });

    it('should handle influencers with no historical data', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'New Influencer',
        discountCodes: [],
      };

      (prisma.influencer.findUnique as any).mockResolvedValue(mockInfluencer);

      const optimization = await optimizeDiscountCodes('test-influencer-id');

      expect(optimization.success).toBe(true);
      expect(optimization.aiOptimization?.confidenceScore).toBeLessThan(0.6);
      expect(optimization.aiOptimization?.strategy).toBe('conservative');
    });
  });

  describe('generateBulkAIInsights', () => {
    it('should generate insights for all influencers', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'Influencer 1',
          discountCodes: [{ usageCount: 50 }],
          payouts: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'influencer-2',
          name: 'Influencer 2',
          discountCodes: [{ usageCount: 30 }],
          payouts: [],
        },
      ];

      (prisma.influencer.findMany as any).mockResolvedValue(mockInfluencers);

      const insights = await generateBulkAIInsights('test-merchant-id');

      expect(insights).toHaveLength(2);
      expect(insights[0].influencerName).toBe('Influencer 1');
      expect(insights[1].influencerName).toBe('Influencer 2');
    });

    it('should handle errors gracefully', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'Influencer 1',
          discountCodes: [],
          payouts: [],
        },
      ];

      (prisma.influencer.findMany as any).mockResolvedValue(mockInfluencers);
      (prisma.influencer.findUnique as any).mockRejectedValue(new Error('Database error'));

      const insights = await generateBulkAIInsights('test-merchant-id');

      expect(insights).toHaveLength(1);
      expect(insights[0].performanceTrend).toBe('unknown');
      expect(insights[0].recommendedActions).toContain('Insufficient data for analysis');
    });
  });

  describe('generateBulkPredictions', () => {
    it('should generate predictions for all influencers', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'Influencer 1',
          commissionRate: 0.1,
          discountCodes: [{ usageCount: 50 }],
          payouts: [{ amount: 1000, status: 'COMPLETED' }],
        },
        {
          id: 'influencer-2',
          name: 'Influencer 2',
          commissionRate: 0.15,
          discountCodes: [{ usageCount: 30 }],
          payouts: [],
        },
      ];

      (prisma.influencer.findMany as any).mockResolvedValue(mockInfluencers);

      const predictions = await generateBulkPredictions('test-merchant-id');

      expect(predictions).toHaveLength(2);
      expect(predictions[0].influencerName).toBe('Influencer 1');
      expect(predictions[1].influencerName).toBe('Influencer 2');
    });
  });
});

describe('AI Analytics API', () => {
  describe('GET /api/analytics/ai-insights', () => {
    it('should return insights for specific influencer', async () => {
      const mockInsight = {
        influencerName: 'Test Influencer',
        performanceTrend: 'growing',
        confidenceScore: 0.8,
        recommendedActions: ['Increase marketing efforts'],
        riskFactors: [],
        growthPotential: 0.7,
      };

      const mockPrediction = {
        influencerName: 'Test Influencer',
        projectedEarnings: 5000,
        growthRate: 0.2,
        churnRisk: 0.1,
        optimalCommissionRate: 0.12,
        recommendedStrategies: ['Optimize discount codes'],
        nextMonthPrediction: 6000,
        seasonalAdjustment: 1.1,
      };

      vi.mock('../lib/ai-analytics', () => ({
        analyzeInfluencerPerformance: vi.fn().mockResolvedValue(mockInsight),
        generatePredictiveMetrics: vi.fn().mockResolvedValue(mockPrediction),
      }));

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-merchant-id': 'test-merchant-id',
        },
        url: '/api/analytics/ai-insights?influencerId=test-id',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.insights).toEqual(mockInsight);
      expect(data.data.predictions).toEqual(mockPrediction);
    });

    it('should return bulk insights for all influencers', async () => {
      const mockInsights = [
        {
          influencerName: 'Influencer 1',
          performanceTrend: 'growing',
          confidenceScore: 0.8,
          recommendedActions: [],
          riskFactors: [],
          growthPotential: 0.7,
        },
      ];

      const mockPredictions = [
        {
          influencerName: 'Influencer 1',
          projectedEarnings: 5000,
          growthRate: 0.2,
          churnRisk: 0.1,
          optimalCommissionRate: 0.12,
          recommendedStrategies: [],
          nextMonthPrediction: 6000,
          seasonalAdjustment: 1.1,
        },
      ];

      vi.mock('../lib/ai-analytics', () => ({
        generateBulkAIInsights: vi.fn().mockResolvedValue(mockInsights),
        generateBulkPredictions: vi.fn().mockResolvedValue(mockPredictions),
      }));

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-merchant-id': 'test-merchant-id',
        },
        url: '/api/analytics/ai-insights',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.insights).toEqual(mockInsights);
      expect(data.data.predictions).toEqual(mockPredictions);
      expect(data.data.summary.totalInfluencers).toBe(1);
    });

    it('should return 401 when merchant ID is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {},
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Merchant ID required');
    });
  });
}); 