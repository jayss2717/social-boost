import { useState, useEffect } from 'react';
import { useMerchantId } from './useMerchantId';

interface MetricsData {
  period: string;
  summary: {
    totalDiscountCodes: number;
    activeDiscountCodes: number;
    totalUsage: number;
    totalRevenue: number;
    influencerCount: number;
    ugcCount: number;
    ugcLimit: number;
    influencerLimit: number;
    totalPayouts: number;
    totalPayoutAmount: number;
  };
  performance: {
    conversionRate: number;
    averageOrderValue: number;
    averagePayoutAmount: number;
  };
  topPerformingCodes: Array<{
    id: string;
    code: string;
    usageCount: number;
    influencerName: string;
    discountValue: number;
    discountType: string;
  }>;
  recentActivity: Array<{
    id: string;
    code: string;
    createdAt: string;
    influencerName: string;
    discountValue: number;
    discountType: string;
  }>;
  orderMetrics: Array<{
    orderId: string;
    totalAmount: number;
    currency: string;
    discountCodesUsed: number;
    customerEmail: string | null;
    processedAt: string;
  }>;
  shopifyAnalytics: any;
}

export function useMetrics(period: string = '30d') {
  const [data, setData] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const merchantId = useMerchantId();

  useEffect(() => {
    if (!merchantId) {
      setIsLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/metrics?period=${period}`, {
          headers: {
            'x-merchant-id': merchantId,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const metricsData = await response.json();
        setData(metricsData);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [merchantId, period]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      setIsLoading(true);
      setError(null);
      // Trigger refetch by updating the effect dependencies
    },
  };
}