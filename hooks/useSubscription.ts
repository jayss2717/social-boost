import useSWR from 'swr';
import { apiFetch } from '@/utils/api';

const fetcher = async (url: string) => {
  const result = await apiFetch(url);
  if (result === null) {
    // Return default subscription structure to prevent React errors
    return {
      subscription: null,
      usage: {
        influencerCount: 0,
        ugcCount: 0,
        influencerLimit: 5,
        ugcLimit: 20,
      },
      plans: [],
    };
  }
  return result;
};

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR('/api/subscription', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useInfluencers() {
  const { data, error, isLoading, mutate } = useSWR('/api/influencers', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useUgcPosts() {
  const { data, error, isLoading, mutate } = useSWR('/api/ugc-posts', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function usePayouts() {
  const { data, error, isLoading, mutate } = useSWR('/api/payouts', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function usePayoutSummary() {
  const { data, error, isLoading, mutate } = useSWR('/api/payouts/summary', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}