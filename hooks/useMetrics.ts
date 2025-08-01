import useSWR from 'swr';
import { apiFetch } from '@/utils/api';
import { useMerchantId } from './useMerchantId';

const fetcher = async (url: string) => {
  // Check if merchantId is available
  const merchantId = typeof window !== 'undefined' 
    ? localStorage.getItem('merchantId')
    : null;

  if (!merchantId) {
    console.log('No merchantId available, skipping metrics fetch');
    return null;
  }

  const result = await apiFetch(url);
  if (result === null) {
    // Return default metrics structure to prevent React errors
    return {
      totalUgcPosts: 0,
      totalInfluencers: 0,
      totalRevenue: 0,
      pendingPayouts: 0,
      approvedPosts: 0,
      pendingApproval: 0,
      averageEngagement: 0,
      topPosts: [],
    };
  }
  return result;
};

export function useMetrics() {
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/metrics' : null, // Only fetch if merchantId exists
    fetcher,
    {
      // Prevent SWR from running during SSR
      revalidateOnMount: typeof window !== 'undefined',
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}