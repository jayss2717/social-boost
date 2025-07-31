// API utility functions for consistent headers and error handling

export async function apiFetch(url: string, options: RequestInit = {}) {
  // Get merchant ID from localStorage or return error
  const merchantId = typeof window !== 'undefined' 
    ? localStorage.getItem('merchantId')
    : null;

  if (!merchantId) {
    console.warn('No merchant ID available for API call to:', url);
    // Return a mock response structure to prevent React errors
    return {
      subscription: null,
      usage: {
        influencerCount: 0,
        ugcCount: 0,
        influencerLimit: 5,
        ugcLimit: 20,
      },
      plans: [],
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-merchant-id': merchantId,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If 404 or other error, return null instead of throwing
      if (response.status === 404) {
        console.log(`API endpoint not found: ${url}`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle API response format
    if (data.success && data.data !== undefined) {
      return data.data;
    }
    
    return data;
  } catch (error) {
    console.error(`API fetch error for ${url}:`, error);
    // Return null instead of throwing to prevent client-side errors
    return null;
  }
}

export async function apiPost(url: string, body: any) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut(url: string, body: any) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete(url: string) {
  return apiFetch(url, {
    method: 'DELETE',
  });
} 