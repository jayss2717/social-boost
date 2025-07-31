import useSWR from 'swr';
import { apiFetch } from '@/utils/api';

const fetcher = (url: string) => apiFetch(url);

export function useInfluencers() {
  const { data, error, isLoading, mutate } = useSWR('/api/influencers', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
} 