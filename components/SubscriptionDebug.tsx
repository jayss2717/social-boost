'use client';

import { Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useState, useEffect } from 'react';

export function SubscriptionDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      // Get shop from URL
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      
      // Check localStorage
      const merchantId = localStorage.getItem('merchantId');
      
      // Test API call
      const response = await fetch(`/api/subscription?shop=${shop}`);
      const subscriptionData = await response.json();
      
      // Test with merchant ID header
      const responseWithHeader = await fetch(`/api/subscription?shop=${shop}`, {
        headers: {
          'x-merchant-id': merchantId || '',
        },
      });
      const subscriptionDataWithHeader = await responseWithHeader.json();
      
      setDebugInfo({
        shop,
        merchantId,
        localStorageKeys: Object.keys(localStorage),
        subscriptionWithoutHeader: subscriptionData,
        subscriptionWithHeader: subscriptionDataWithHeader,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
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