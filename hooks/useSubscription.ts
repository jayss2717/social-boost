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

// Fallback fetcher that gets merchant data by ID and then fetches subscription
const fallbackFetcher = async (merchantId: string) => {
  console.log('🔍 Using fallback approach - getting merchant data by ID:', merchantId);
  
  try {
    // First, get merchant data by ID
    const merchantResponse = await fetch(`/api/merchant/by-id?merchantId=${merchantId}`);
    if (!merchantResponse.ok) {
      console.log('❌ Failed to get merchant data by ID');
      return null;
    }
    
    const merchantData = await merchantResponse.json();
    console.log('📊 Merchant data retrieved:', merchantData);
    
    if (!merchantData.success || !merchantData.merchant?.shop) {
      console.log('❌ No shop found in merchant data');
      return null;
    }
    
    // Now fetch subscription data using the shop
    const shop = merchantData.merchant.shop;
    console.log('🔍 Fetching subscription data for shop:', shop);
    
    const subscriptionResponse = await fetch(`/api/subscription?shop=${shop}`, {
      headers: {
        'x-merchant-id': merchantId,
      },
    });
    
    if (!subscriptionResponse.ok) {
      console.log('❌ Failed to fetch subscription data');
      return null;
    }
    
    const subscriptionData = await subscriptionResponse.json();
    console.log('✅ Fallback subscription data fetched:', subscriptionData);
    return subscriptionData;
    
  } catch (error) {
    console.error('❌ Error in fallback fetcher:', error);
    return null;
  }
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

  // Determine which fetcher to use
  const shouldUseFallback = merchantId && !shop;
  const fetcherKey = shouldUseFallback ? `fallback-${merchantId}` : (merchantId && shop ? `/api/subscription?shop=${shop}` : null);
  const fetcherFunction = shouldUseFallback ? () => fallbackFetcher(merchantId!) : fetcher;

  const { data, error, isLoading, mutate } = useSWR(
    fetcherKey,
    fetcherFunction,
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
    shouldUseFallback,
    fetcherKey,
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