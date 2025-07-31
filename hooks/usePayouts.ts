import useSWR from 'swr';
import { apiFetch } from '@/utils/api';

const fetcher = (url: string) => apiFetch(url);

export function usePayouts() {
  const { data, error, isLoading, mutate } = useSWR('/api/payouts', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
} 