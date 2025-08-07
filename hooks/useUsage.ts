import useSWR from 'swr';
import { apiFetch } from '@/utils/api';
import { useMerchantId } from './useMerchantId';
import { useState, useEffect } from 'react';

const fetcher = async (url: string) => {
  const result = await apiFetch(url);
  if (result === null) {
    return {
      usage: {
        ugcCount: 0,
        influencerCount: 0,
        ugcLimit: 5,
        influencerLimit: 1,
      },
      plan: {
        name: 'Starter',
        priceCents: 0,
      },
      subscription: null,
    };
  }
  return result;
};

export function useUsage() {
  const merchantId = useMerchantId();
  const [shop, setShop] = useState<string | null>(null);
  
  // Get shop from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    setShop(shopParam);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    merchantId && shop ? `/api/usage?shop=${shop}` : null,
    fetcher,
    {
      revalidateOnMount: typeof window !== 'undefined',
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
} 