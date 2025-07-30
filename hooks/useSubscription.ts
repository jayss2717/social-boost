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

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR('/api/subscription', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useInfluencers() {
  const { data, error, isLoading, mutate } = useSWR('/api/influencers', (url) => 
    fetch(url, {
      headers: {
        'x-merchant-id': 'cmdpgbpw60003vgpvtdgr4pj5'
      }
    }).then(res => {
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
    })
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useUgcPosts() {
  const { data, error, isLoading, mutate } = useSWR('/api/ugc-posts', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function usePayouts() {
  const { data, error, isLoading, mutate } = useSWR('/api/payouts', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function usePayoutSummary() {
  const { data, error, isLoading, mutate } = useSWR('/api/payouts/summary', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
} 