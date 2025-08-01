'use client';

import { useEffect, useState } from 'react';

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
                          window.location.hostname.includes('shopify.com');

    console.log('Is Shopify admin context:', isShopifyAdmin);

    if (isShopifyAdmin) {
      // Initialize Shopify App Bridge with better error handling
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@shopify/app-bridge@3.7.8/umd/index.js';
      script.async = true;
      
      script.onload = () => {
        try {
          // @ts-ignore
          if (typeof window.createApp === 'function') {
            const host = new URLSearchParams(window.location.search).get('host');
            const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '4638bbbd1542925e067ab11f3eecdc1c';
            
            if (!host) {
              console.warn('No host parameter found, skipping App Bridge initialization');
              setIsLoaded(true);
              return;
            }

            // @ts-ignore
            const app = window.createApp({
              apiKey,
              host,
              forceRedirect: false, // Changed to false to prevent redirect loops
            });
            
            // Store app instance globally
            // @ts-ignore
            window.shopifyApp = app;
            console.log('Shopify App Bridge initialized successfully');
            setIsLoaded(true);
          } else {
            console.warn('Shopify App Bridge createApp function not available');
            setIsLoaded(true);
          }
        } catch (error) {
          console.error('Failed to initialize Shopify App Bridge:', error);
          setIsLoaded(true); // Continue anyway
        }
      };
      
      script.onerror = () => {
        console.warn('Failed to load Shopify App Bridge script');
        setIsLoaded(true);
      };
      
      document.head.appendChild(script);
    } else {
      // Check if we're in an iframe (Shopify admin context)
      const isInIframe = window !== window.top;
      console.log('Is in iframe:', isInIframe);
      
      if (isInIframe) {
        console.log('Detected iframe context, attempting App Bridge initialization');
        // Try to initialize anyway for iframe contexts
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@shopify/app-bridge@3.7.8/umd/index.js';
        script.async = true;
        
        script.onload = () => {
          try {
            // @ts-ignore
            if (typeof window.createApp === 'function') {
              const host = new URLSearchParams(window.location.search).get('host');
              const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '4638bbbd1542925e067ab11f3eecdc1c';
              
              if (host) {
                // @ts-ignore
                const app = window.createApp({
                  apiKey,
                  host,
                  forceRedirect: false,
                });
                
                // @ts-ignore
                window.shopifyApp = app;
                console.log('Shopify App Bridge initialized in iframe context');
              }
            }
          } catch (error) {
            console.error('Failed to initialize App Bridge in iframe:', error);
          }
          setIsLoaded(true);
        };
        
        script.onerror = () => {
          console.warn('Failed to load App Bridge script in iframe');
          setIsLoaded(true);
        };
        
        document.head.appendChild(script);
      } else {
        console.log('Not in Shopify admin context, skipping App Bridge initialization');
        console.log('Setting isLoaded to true for development/testing');
        // For development/testing, still set as loaded
        setIsLoaded(true);
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