// Shopify utility functions

export function isShopifyAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isInIframe = window !== window.top;
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');
  
  return window.location.hostname.includes('myshopify.com') || 
         window.location.hostname.includes('shopify.com') ||
         window.location.hostname.includes('shopify.dev') ||
         isInIframe ||
         !!shop ||
         !!host;
}

export function getShopifyHost(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  let host = urlParams.get('host');
  
  // If no host in URL, try to get it from parent window (for iframe scenarios)
  if (!host && window !== window.top) {
    try {
      const parentUrl = new URL(window.parent.location.href);
      host = parentUrl.searchParams.get('host');
    } catch (e) {
      console.log('Could not access parent window for host parameter');
    }
  }
  
  // If still no host, try to construct it from shop parameter
  if (!host) {
    const shop = urlParams.get('shop');
    if (shop) {
      host = shop;
    }
  }
  
  return host;
}

export function getShopifyShop(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('shop');
}

export function getShopifyContext() {
  if (typeof window === 'undefined') return null;
  
  const isInIframe = window !== window.top;
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');
  
  return {
    isInIframe,
    shop,
    host,
    isShopifyAdmin: isShopifyAdmin(),
    hostname: window.location.hostname,
    url: window.location.href,
  };
} 