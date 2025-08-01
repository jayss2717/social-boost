import useSWR from 'swr';

interface ShopifyData {
  shop?: {
    id: number;
    name: string;
    email: string;
    domain: string;
    currency: string;
    timezone: string;
    locale: string;
  };
  productsCount?: number;
  recentOrdersCount?: number;
  customersCount?: number;
  recentRevenue?: number;
  recentOrders?: number;
  appMetrics?: {
    totalUgcPosts: number;
    activeInfluencers: number;
    approvedPosts: number;
    pendingApproval: number;
    pendingPayouts: number;
  };
}

interface ShopifyDataResponse {
  success: boolean;
  data?: ShopifyData;
  error?: string;
}

const fetcher = async (url: string): Promise<ShopifyDataResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export function useShopifyData(shop?: string) {
  const { data, error, isLoading, mutate } = useSWR<ShopifyDataResponse>(
    shop ? `/api/shopify/data?shop=${shop}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  );

  return {
    shopifyData: data?.data,
    isLoading,
    error: error || data?.error,
    mutate,
    isSuccess: data?.success,
  };
} 