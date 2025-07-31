import useSWR from 'swr';
import { apiFetch } from '@/utils/api';

const fetcher = async (url: string) => {
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
  const { data, error, isLoading, mutate } = useSWR('/api/metrics', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}