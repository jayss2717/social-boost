import { useState, useEffect } from 'react';

export function useShop() {
  const [shop, setShop] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Get shop from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let shopParam = urlParams.get('shop');
    const hostParam = urlParams.get('host');
    
    // If no shop parameter but we have host, try to use host as shop
    if (!shopParam && hostParam) {
      console.log('🔍 useShop: No shop parameter, using host as shop:', hostParam);
      shopParam = hostParam;
    }
    
    if (shopParam) {
      console.log('🔍 useShop: Setting shop to:', shopParam);
      setShop(shopParam);
    } else {
      console.log('🔍 useShop: No shop or host parameter found in URL');
    }
  }, []);

  // Return null during server-side rendering
  if (!isClient) {
    return null;
  }

  return shop;
} 