import useSWR from 'swr';
import { apiFetch } from '@/utils/api';
import { useMerchantId } from './useMerchantId';

const fetcher = async (url: string) => {
  // Check if merchantId is available
  const merchantId = typeof window !== 'undefined' 
    ? localStorage.getItem('merchantId')
    : null;

  if (!merchantId) {
    console.log('No merchantId available, skipping subscription fetch');
    return null;
  }

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
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/subscription' : null, // Only fetch if merchantId exists
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useInfluencers() {
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/influencers' : null, // Only fetch if merchantId exists
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useUgcPosts() {
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/ugc-posts' : null, // Only fetch if merchantId exists
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function usePayouts() {
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/payouts' : null, // Only fetch if merchantId exists
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function usePayoutSummary() {
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/payouts/summary' : null, // Only fetch if merchantId exists
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useSettings() {
  const merchantId = useMerchantId();

  const { data, error, isLoading, mutate } = useSWR(
    merchantId ? '/api/settings' : null, // Only fetch if merchantId exists
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}