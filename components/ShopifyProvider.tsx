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
    
    // Enhanced Shopify admin context detection
    const isInIframe = window !== window.top;
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');
    
    // Check if we're in a Shopify admin context
    const isShopifyAdmin = window.location.hostname.includes('myshopify.com') || 
                          window.location.hostname.includes('shopify.com') ||
                          window.location.hostname.includes('shopify.dev') ||
                          isInIframe ||
                          shop ||
                          host;

    console.log('Enhanced Shopify admin detection:', {
      isInIframe,
      shop,
      host,
      isShopifyAdmin,
      hostname: window.location.hostname,
    });

    const initializeAppBridge = () => {
      try {
        // Enhanced host parameter detection
        let detectedHost = host;
        
        // If no host in URL, try to get it from parent window (for iframe scenarios)
        if (!detectedHost && isInIframe) {
          try {
            const parentUrl = new URL(window.parent.location.href);
            detectedHost = parentUrl.searchParams.get('host');
            console.log('Retrieved host from parent window:', detectedHost);
          } catch (e) {
            console.log('Could not access parent window for host parameter');
          }
        }
        
        // If still no host, try to construct it from shop parameter
        if (!detectedHost && shop) {
          detectedHost = shop;
          console.log('Using shop as host parameter:', detectedHost);
        }
        
        const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '4638bbbd1542925e067ab11f3eecdc1c';
        
        if (!detectedHost) {
          console.warn('No host parameter found, skipping App Bridge initialization');
          console.log('This is normal when running outside Shopify admin context');
          console.log('App will still function normally without App Bridge features');
          
          // For development/testing, you can mock the host parameter
          if (process.env.NODE_ENV === 'development') {
            if (shop) {
              console.log('Development mode: Using shop as host parameter for testing');
              detectedHost = shop;
            }
          }
          
          if (!detectedHost) {
            setIsLoaded(true);
            return;
          }
        }

        console.log('Initializing App Bridge with host:', detectedHost);
        
        const app = createApp({
          apiKey,
          host: detectedHost,
          forceRedirect: false, // Prevent redirect loops
        });
        
        // Store app instance globally
        // @ts-ignore
        window.shopifyApp = app;
        console.log('✅ Shopify App Bridge initialized successfully');
        setIsLoaded(true);
      } catch (error) {
        console.error('❌ Failed to initialize Shopify App Bridge:', error);
        setIsLoaded(true); // Continue anyway
      }
    };

    // Always attempt initialization if we're in a Shopify context
    if (isShopifyAdmin) {
      console.log('✅ Shopify admin context detected, initializing App Bridge');
      initializeAppBridge();
    } else {
      console.log('⚠️ Not in Shopify admin context, skipping App Bridge initialization');
      console.log('Setting isLoaded to true for development/testing');
      setIsLoaded(true);
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