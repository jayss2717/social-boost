'use client';

import { useEffect, useState } from 'react';
import { createApp } from '@shopify/app-bridge';

interface ShopifyProviderProps {
  children: React.ReactNode;
}

export function ShopifyProvider({ children }: ShopifyProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    console.log('ShopifyProvider: Initializing...');
    console.log('Current hostname:', window.location.hostname);
    console.log('Current URL:', window.location.href);
    
    // Check if we're in a Shopify admin context
    const isShopifyAdmin = window.location.hostname.includes('myshopify.com') || 
                          window.location.hostname.includes('shopify.com') ||
                          window.location.hostname.includes('shopify.dev');

    console.log('Is Shopify admin context:', isShopifyAdmin);

    const initializeAppBridge = () => {
      try {
        // Try to get host from URL params first
        let host = new URLSearchParams(window.location.search).get('host');
        
        // If no host in URL, try to get it from parent window (for iframe scenarios)
        if (!host && window !== window.top) {
          try {
            const parentUrl = new URL(window.parent.location.href);
            host = parentUrl.searchParams.get('host');
          } catch (e) {
            console.log('Could not access parent window for host parameter');
          }
        }
        
        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '4638bbbd1542925e067ab11f3eecdc1c';
        
        if (!host) {
          console.warn('No host parameter found, skipping App Bridge initialization');
          console.log('This is normal when running outside Shopify admin context');
          console.log('App will still function normally without App Bridge features');
          
          // For development/testing, you can mock the host parameter
          if (process.env.NODE_ENV === 'development') {
            const shop = new URLSearchParams(window.location.search).get('shop');
            if (shop) {
              console.log('Development mode: Using shop as host parameter for testing');
              host = shop;
            }
          }
          
          if (!host) {
            setIsLoaded(true);
            return;
          }
        }

        const app = createApp({
          apiKey,
          host,
          forceRedirect: false, // Prevent redirect loops
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
    };

    if (isShopifyAdmin) {
      // Initialize immediately in Shopify admin context
      initializeAppBridge();
    } else {
      // Check if we're in an iframe (Shopify admin context)
      const isInIframe = window !== window.top;
      console.log('Is in iframe:', isInIframe);
      
      if (isInIframe) {
        console.log('Detected iframe context, attempting App Bridge initialization');
        initializeAppBridge();
      } else {
        // Check if we have shop parameter (indicates Shopify context)
        const shop = new URLSearchParams(window.location.search).get('shop');
        if (shop) {
          console.log('Shop parameter found, attempting App Bridge initialization');
          initializeAppBridge();
        } else {
          console.log('Not in Shopify admin context, skipping App Bridge initialization');
          console.log('Setting isLoaded to true for development/testing');
          // For development/testing, still set as loaded
          setIsLoaded(true);
        }
      }
    }
  }, [isClient]);

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  // Production-ready loading state
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading SocialBoost...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we initialize your app</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}