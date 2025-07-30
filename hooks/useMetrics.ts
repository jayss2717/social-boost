import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json().then(data => {
    // Handle API response format
    if (data.success && data.data !== undefined) {
      return data.data;
    }
    return data;
  });
});

export function useMetrics() {
  const { data, error, isLoading, mutate } = useSWR('/api/metrics', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}