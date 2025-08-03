import useSWR from 'swr';
import { apiFetch } from '@/utils/api';
import { useMerchantId } from './useMerchantId';
import { useState, useEffect } from 'react';

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
  const [shop, setShop] = useState<string | null>(null);
  
  // Get shop from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    setShop(shopParam);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    merchantId && shop ? `/api/subscription?shop=${shop}` : null, // Only fetch if merchantId and shop exist
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