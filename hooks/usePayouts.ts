import useSWR from 'swr';
import { apiFetch } from '@/utils/api';
import { useMerchantId } from './useMerchantId';

const fetcher = async (url: string) => {
  // Check if merchantId is available
  const merchantId = typeof window !== 'undefined' 
    ? localStorage.getItem('merchantId')
    : null;

  if (!merchantId) {
    console.log('No merchantId available, skipping payouts fetch');
    return null;
  }

  const result = await apiFetch(url);
  if (result === null) {
    // Return default structure to prevent React errors
    return [];
  }
  return result;
};

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