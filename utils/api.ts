// API utility functions for consistent headers and error handling

export async function apiFetch(url: string, options: RequestInit = {}) {
  // Get merchant ID from localStorage or return error
  const merchantId = typeof window !== 'undefined' 
    ? localStorage.getItem('merchantId')
    : null;

  console.log('API call details:', {
    url,
    merchantId: merchantId ? 'present' : 'missing',
    hasWindow: typeof window !== 'undefined',
  });

  if (!merchantId) {
    console.warn('No merchant ID available for API call to:', url);
    console.log('Available localStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'no window');
    
    // Return a mock response structure to prevent React errors
    return {
      subscription: null,
      usage: {
        influencerCount: 0,
        ugcCount: 0,
        ugcLimit: 5,        // Updated to match Starter plan
        influencerLimit: 1,  // Updated to match Starter plan
      },
      plans: [],
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-merchant-id': merchantId,
    ...options.headers,
  };

  console.log('Making API call with headers:', {
    url,
    merchantId,
    hasContentType: headers['Content-Type'] ? 'yes' : 'no',
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('API response:', {
      url,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      // If 404 or other error, return null instead of throwing
      if (response.status === 404) {
        console.log(`API endpoint not found: ${url}`);
        return null;
      }
      
      if (response.status === 401) {
        console.error(`Unauthorized API call to ${url}. Merchant ID: ${merchantId}`);
        // Try to get merchant ID from URL params as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        if (shop) {
          console.log('Attempting to fetch merchant data for shop:', shop);
          try {
            const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
            if (merchantResponse.ok) {
              const merchantData = await merchantResponse.json();
              localStorage.setItem('merchantId', merchantData.id);
              console.log('Merchant ID set from fallback:', merchantData.id);
              // Retry the original request
              return apiFetch(url, options);
            }
          } catch (fallbackError) {
            console.error('Fallback merchant fetch failed:', fallbackError);
          }
        }
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