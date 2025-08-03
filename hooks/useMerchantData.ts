import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface MerchantData {
  id: string;
  shop: string;
  accessToken: string;
  shopifyShopId: string;
  shopName: string;
  shopEmail: string;
  shopDomain: string;
  shopCurrency: string;
  shopTimezone: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number;
  settings?: any;
}

const fetcher = async (url: string): Promise<MerchantData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch merchant data');
  }
  return response.json();
};

export function useMerchantData(shop?: string) {
  const [merchantId, setMerchantId] = useState<string | null>(null);

  // Get merchantId from localStorage
  useEffect(() => {
    const storedMerchantId = localStorage.getItem('merchantId');
    setMerchantId(storedMerchantId);
  }, []);

  // Fetch merchant data using SWR for automatic revalidation
  const { data: merchantData, error, isLoading, mutate } = useSWR(
    shop ? `/api/merchant?shop=${shop}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds during setup
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Check if OAuth is completed
  const isOAuthCompleted = merchantData?.accessToken && 
    merchantData.accessToken !== 'pending' && 
    merchantData.shopifyShopId;

  // Auto-refresh when OAuth completes
  useEffect(() => {
    if (merchantData && !isOAuthCompleted) {
      // If OAuth is not completed, refresh more frequently
      const interval = setInterval(() => {
        mutate();
      }, 2000); // Check every 2 seconds

      // Add timeout to prevent infinite loop
      const timeout = setTimeout(() => {
        console.log('OAuth timeout reached, stopping refresh');
      }, 60000); // Stop after 1 minute

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [merchantData, isOAuthCompleted, mutate]);

  return {
    merchantData,
    error,
    isLoading,
    isOAuthCompleted,
    mutate, // Function to manually refresh data
  };
} 