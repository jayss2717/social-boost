'use client';

import { useEffect, useState } from 'react';

interface MerchantInitializerProps {
  children: React.ReactNode;
}

export function MerchantInitializer({ children }: MerchantInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        console.log('MerchantInitializer: Starting merchant initialization...');
        
        // Check if merchantId already exists in localStorage
        const existingMerchantId = localStorage.getItem('merchantId');
        if (existingMerchantId) {
          console.log('MerchantInitializer: Found existing merchantId:', existingMerchantId);
          setIsInitialized(true);
          return;
        }

        // Get shop and host from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        const host = urlParams.get('host');

        console.log('MerchantInitializer: URL parameters:', { shop, host });

        if (!shop && !host) {
          console.log('MerchantInitializer: No shop or host parameter found');
          // For development, try to get merchant from test endpoint
          if (process.env.NODE_ENV === 'development') {
            console.log('MerchantInitializer: Development mode, trying to get test merchant');
            try {
              const response = await fetch('/api/test/merchants');
              if (response.ok) {
                const merchants = await response.json();
                if (merchants && merchants.length > 0) {
                  const merchantId = merchants[0].id;
                  localStorage.setItem('merchantId', merchantId);
                  console.log('MerchantInitializer: Set test merchantId:', merchantId);
                  setIsInitialized(true);
                  return;
                }
              }
            } catch (error) {
              console.error('MerchantInitializer: Failed to get test merchant:', error);
            }
          }
          
          // If no merchant found, set a default for development
          if (process.env.NODE_ENV === 'development') {
            const defaultMerchantId = 'test-merchant-1';
            localStorage.setItem('merchantId', defaultMerchantId);
            console.log('MerchantInitializer: Set default merchantId for development:', defaultMerchantId);
            setIsInitialized(true);
            return;
          }
          
          console.error('MerchantInitializer: No merchant context found');
          setIsInitialized(true); // Continue anyway
          return;
        }

        // Try to get merchant by shop or host (prefer shop)
        const shopOrHost = shop || host;
        if (shopOrHost) {
          console.log('MerchantInitializer: Fetching merchant for:', shopOrHost);
          try {
            const response = await fetch(`/api/merchant?shop=${shopOrHost}`);
            if (response.ok) {
              const merchant = await response.json();
              if (merchant && merchant.id) {
                localStorage.setItem('merchantId', merchant.id);
                console.log('MerchantInitializer: Set merchantId:', merchant.id);
                setIsInitialized(true);
                return;
              }
            }
          } catch (error) {
            console.error('MerchantInitializer: Failed to fetch merchant:', error);
          }
        }

        console.warn('MerchantInitializer: Could not determine merchant ID');
        setIsInitialized(true); // Continue anyway
      } catch (error) {
        console.error('MerchantInitializer: Error during initialization:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeMerchant();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Initializing merchant context...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 