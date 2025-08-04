import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';
import { 
  generateBulkAIInsights, 
  generateBulkPredictions,
  analyzeInfluencerPerformance,
  generatePredictiveMetrics 
} from '@/lib/ai-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const { searchParams } = new URL(request.url);
    
    const influencerId = searchParams.get('influencerId');
    const type = searchParams.get('type') || 'all'; // 'insights', 'predictions', 'all'

    if (influencerId) {
      // Get insights for specific influencer
      const insights = await analyzeInfluencerPerformance(influencerId);
      const predictions = await generatePredictiveMetrics(influencerId);
      
      return createSuccessResponse({
        insights,
        predictions,
      });
    } else {
      // Get bulk insights for all influencers
      let insights = null;
      let predictions = null;

      if (type === 'insights' || type === 'all') {
        insights = await generateBulkAIInsights(merchantId);
      }

      if (type === 'predictions' || type === 'all') {
        predictions = await generateBulkPredictions(merchantId);
      }

      return createSuccessResponse({
        insights,
        predictions,
        summary: {
          totalInfluencers: insights?.length || predictions?.length || 0,
          insightsGenerated: insights?.length || 0,
          predictionsGenerated: predictions?.length || 0,
        },
      });
    }
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to generate AI insights', 500);
  }
} 