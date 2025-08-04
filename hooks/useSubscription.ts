import useSWR from 'swr';
import { apiFetch } from '@/utils/api';
import { useMerchantId } from './useMerchantId';
import { useState, useEffect, useCallback } from 'react';

const fetcher = async (url: string) => {
  console.log('🔍 Fetching subscription data from:', url);
  
  const result = await apiFetch(url);
  console.log('📊 Subscription API result:', result);
  
  if (result === null) {
    console.log('❌ No subscription data returned from API');
    // Return default subscription structure to prevent React errors
    return {
      subscription: null,
      usage: {
        influencerCount: 0,
        ugcCount: 0,
        influencerLimit: 1, // Updated to match Starter plan
        ugcLimit: 5,        // Updated to match Starter plan
      },
      plans: [],
    };
  }
  
  console.log('✅ Subscription data fetched successfully:', result);
  return result;
};

export function useSubscription() {
  const merchantId = useMerchantId();
  const [shop, setShop] = useState<string | null>(null);
  const [paymentSuccessProcessed, setPaymentSuccessProcessed] = useState(false);
  
  // Get shop from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    setShop(shopParam);
    console.log('🔍 Shop parameter detected:', shopParam);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    merchantId && shop ? `/api/subscription?shop=${shop}` : null, // Only fetch if merchantId and shop exist
    fetcher,
    {
      // Prevent SWR from running during SSR
      revalidateOnMount: typeof window !== 'undefined',
      // Force refresh when payment is successful
      revalidateOnFocus: true,
      refreshInterval: 0, // Disable automatic refresh
    }
  );

  // Force refresh when payment success is detected (only once)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    
    if (paymentSuccess === 'true' && merchantId && shop && !paymentSuccessProcessed) {
      console.log('Payment success detected, refreshing subscription data...');
      setPaymentSuccessProcessed(true);
      mutate();
    }
  }, [merchantId, shop, mutate, paymentSuccessProcessed]);

  console.log('🔍 useSubscription hook state:', {
    merchantId: merchantId ? 'present' : 'missing',
    shop,
    data: data ? 'present' : 'missing',
    isLoading,
    error: error ? 'present' : 'missing',
  });

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}