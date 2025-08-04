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
    let shopParam = urlParams.get('shop');
    const hostParam = urlParams.get('host');
    
    // If no shop parameter but we have host, try to use host as shop
    if (!shopParam && hostParam) {
      console.log('🔍 useShop: No shop parameter, using host as shop:', hostParam);
      shopParam = hostParam;
    }
    
    if (shopParam) {
      console.log('🔍 useShop: Setting shop to:', shopParam);
      setShop(shopParam);
    } else {
      console.log('🔍 useShop: No shop or host parameter found in URL');
    }
  }, []);

  // Determine the API URL based on available parameters
  const getApiUrl = () => {
    if (shop && merchantId) {
      return `/api/subscription?shop=${shop}`;
    } else if (merchantId) {
      return `/api/subscription?merchantId=${merchantId}`;
    }
    return null;
  };

  const apiUrl = getApiUrl();

  const { data, error, isLoading, mutate } = useSWR(
    apiUrl,
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
    
    if (paymentSuccess === 'true' && merchantId && !paymentSuccessProcessed) {
      console.log('Payment success detected, refreshing subscription data...');
      setPaymentSuccessProcessed(true);
      mutate();
    }
  }, [merchantId, mutate, paymentSuccessProcessed]);

  console.log('🔍 useSubscription hook state:', {
    merchantId: merchantId ? 'present' : 'missing',
    shop,
    apiUrl,
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