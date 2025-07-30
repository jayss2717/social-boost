// API utility functions for consistent headers and error handling

const DEMO_MERCHANT_ID = 'cmdpgbpw60003vgpvtdgr4pj5';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-merchant-id': DEMO_MERCHANT_ID,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Handle API response format
  if (data.success && data.data !== undefined) {
    return data.data;
  }
  
  return data;
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