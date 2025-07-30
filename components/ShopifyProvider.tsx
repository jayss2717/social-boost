'use client';

import { useEffect, useState } from 'react';

interface ShopifyProviderProps {
  children: React.ReactNode;
}

export function ShopifyProvider({ children }: ShopifyProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if we're in a Shopify admin context
    const isShopifyAdmin = window.location.hostname.includes('myshopify.com') || 
                          window.location.hostname.includes('shopify.com');

    if (isShopifyAdmin) {
      // Initialize Shopify App Bridge
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@shopify/app-bridge@3.7.9/dist/index.umd.js';
      script.onload = () => {
        // @ts-ignore
        if (window.createApp) {
          try {
            // @ts-ignore
            const app = window.createApp({
              apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '4638bbbd1542925e067ab11f3eecdc1c',
              host: new URLSearchParams(window.location.search).get('host') || '',
              forceRedirect: true,
            });
            
            // Store app instance globally
            // @ts-ignore
            window.shopifyApp = app;
            console.log('Shopify App Bridge initialized successfully');
            setIsLoaded(true);
          } catch (error) {
            console.error('Failed to initialize Shopify App Bridge:', error);
            setIsLoaded(true); // Continue anyway
          }
        } else {
          console.warn('Shopify App Bridge not available');
          setIsLoaded(true);
        }
      };
      script.onerror = () => {
        console.warn('Failed to load Shopify App Bridge');
        setIsLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      console.log('Not in Shopify admin context, skipping App Bridge initialization');
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SocialBoost...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 