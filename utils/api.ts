// API utility functions for consistent headers and error handling

const DEMO_MERCHANT_ID = 'cmdpgbpw60003vgpvtdgr4pj5';

export async function apiFetch(url: string, options: RequestInit = {}) {
  // Get merchant ID from localStorage or use demo ID
  const merchantId = typeof window !== 'undefined' 
    ? localStorage.getItem('merchantId') || DEMO_MERCHANT_ID
    : DEMO_MERCHANT_ID;

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