import { useState, useEffect } from 'react';

export function useShop() {
  const [shop, setShop] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Get shop from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setShop(shopParam);
    }
  }, []);

  // Return null during server-side rendering
  if (!isClient) {
    return null;
  }

  return shop;
} 