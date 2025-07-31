import useSWR from 'swr';
import { apiFetch } from '@/utils/api';

const fetcher = (url: string) => apiFetch(url);

export function useUgcPosts() {
  const { data, error, isLoading, mutate } = useSWR('/api/ugc-posts', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
} 