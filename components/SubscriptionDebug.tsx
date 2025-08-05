'use client';

import { Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useState } from 'react';

interface DebugInfo {
  shop: string | null;
  host: string | null;
  merchantId: string | null;
  localStorageKeys: string[];
  subscriptionWithoutHeader: Record<string, unknown>;
  subscriptionWithHeader: Record<string, unknown>;
  subscriptionWithMerchantId: Record<string, unknown>;
  timestamp: string;
  error?: string;
  urlParams?: Record<string, string | null>;
  shopifyContext?: Record<string, unknown>;
}

export function SubscriptionDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      // Get shop from URL with more detailed logging
      const urlParams = new URLSearchParams(window.location.search);
      let shop = urlParams.get('shop');
      const host = urlParams.get('host');
      
      // Log all URL parameters for debugging
      const allParams: Record<string, string | null> = {};
      urlParams.forEach((value, key) => {
        allParams[key] = value;
      });
      
      console.log('🔍 Debug: URL parameters:', allParams);
      console.log('🔍 Debug: Shop parameter:', shop);
      console.log('🔍 Debug: Host parameter:', host);
      
      // If no shop but we have host, try to use host as shop
      if (!shop && host) {
        console.log('🔍 Debug: No shop parameter, trying to use host as shop');
        shop = host;
      }
      
      // Check if we're in Shopify admin context
      const isInIframe = window !== window.top;
      const isShopifyAdmin = window.location.hostname.includes('myshopify.com') || 
                            window.location.hostname.includes('shopify.com') ||
                            window.location.hostname.includes('shopify.dev') ||
                            isInIframe ||
                            !!shop ||
                            !!host;
      
      const shopifyContext = {
        isInIframe,
        shop,
        host,
        isShopifyAdmin,
        hostname: window.location.hostname,
        url: window.location.href,
      };
      
      console.log('🔍 Debug: Shopify context:', shopifyContext);
      
      // Check localStorage
      const merchantId = localStorage.getItem('merchantId');
      console.log('🔍 Debug: Merchant ID from localStorage:', merchantId);
      
      if (!shop && !merchantId) {
        setDebugInfo({
          shop: null,
          host,
          merchantId,
          localStorageKeys: Object.keys(localStorage),
          subscriptionWithoutHeader: { error: 'No shop or merchantId available' },
          subscriptionWithHeader: { error: 'No shop or merchantId available' },
          subscriptionWithMerchantId: { error: 'No shop or merchantId available' },
          timestamp: new Date().toISOString(),
          urlParams: allParams,
          shopifyContext,
          error: 'Neither shop parameter nor merchantId available',
        });
        return;
      }
      
      // Test API call without header (if shop available)
      let subscriptionData = { error: 'Shop parameter is null' };
      if (shop) {
        console.log('🔍 Debug: Testing API call without header for shop:', shop);
        const response = await fetch(`/api/subscription?shop=${shop}`);
        subscriptionData = await response.json();
        console.log('🔍 Debug: API response without header:', subscriptionData);
      }
      
      // Test with merchant ID header (if shop available)
      let subscriptionDataWithHeader = { error: 'Shop parameter is null' };
      if (shop) {
        console.log('🔍 Debug: Testing API call with header for shop:', shop);
        const responseWithHeader = await fetch(`/api/subscription?shop=${shop}`, {
          headers: {
            'x-merchant-id': merchantId || '',
          },
        });
        subscriptionDataWithHeader = await responseWithHeader.json();
        console.log('🔍 Debug: API response with header:', subscriptionDataWithHeader);
      }
      
      // Test with merchantId parameter (if merchantId available)
      let subscriptionDataWithMerchantId = { error: 'MerchantId not available' };
      if (merchantId) {
        console.log('🔍 Debug: Testing API call with merchantId parameter:', merchantId);
        const responseWithMerchantId = await fetch(`/api/subscription?merchantId=${merchantId}`);
        subscriptionDataWithMerchantId = await responseWithMerchantId.json();
        console.log('🔍 Debug: API response with merchantId:', subscriptionDataWithMerchantId);
      }
      
      setDebugInfo({
        shop,
        host,
        merchantId,
        localStorageKeys: Object.keys(localStorage),
        subscriptionWithoutHeader: subscriptionData,
        subscriptionWithHeader: subscriptionDataWithHeader,
        subscriptionWithMerchantId: subscriptionDataWithMerchantId,
        timestamp: new Date().toISOString(),
        urlParams: allParams,
        shopifyContext,
      });
    } catch (error) {
      console.error('🔍 Debug: Error during debug check:', error);
      setDebugInfo({
        shop: null,
        host: null,
        merchantId: null,
        localStorageKeys: [],
        subscriptionWithoutHeader: null,
        subscriptionWithHeader: null,
        subscriptionWithMerchantId: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-4">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Subscription Debug
          </Text>
          
          <Button 
            onClick={runDebug}
            loading={isLoading}
            variant="secondary"
          >
            Run Debug Check
          </Button>
          
          {debugInfo && (
            <div className="mt-4">
              <Text variant="bodyMd" fontWeight="semibold" as="p">
                Debug Results:
              </Text>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </BlockStack>
      </div>
    </Card>
  );
} 