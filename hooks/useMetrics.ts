import useSWR from 'swr';
import { apiFetch } from '@/utils/api';

const fetcher = (url: string) => apiFetch(url);

export function useMetrics() {
  const { data, error, isLoading, mutate } = useSWR('/api/metrics', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}