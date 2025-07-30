'use client';

import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useState } from 'react';

export default function TestOnboardingPage() {
  const [shop, setShop] = useState('test-store.myshopify.com');

  const simulateOAuth = async () => {
    try {
      // Create a test merchant with onboarding not completed
      const response = await fetch('/api/test/create-merchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          shopName: 'Test Store',
          shopEmail: 'test@example.com',
          shopDomain: 'test-store.myshopify.com',
          shopCurrency: 'USD',
          shopTimezone: 'America/New_York',
          shopLocale: 'en',
        }),
      });

      if (response.ok) {
        // Redirect to onboarding
        window.location.href = `/onboarding?shop=${shop}`;
      }
    } catch (error) {
      console.error('Failed to create test merchant:', error);
    }
  };

  const goToDashboard = () => {
    window.location.href = '/';
  };

  return (
    <Page title="Test Onboarding Flow">
      <Layout>
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">
                  Test Onboarding Flow
                </Text>
                
                <Text variant="bodyMd" as="p">
                  This page helps you test the onboarding flow without going through the full Shopify OAuth process.
                </Text>

                <div className="space-y-4">
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      Shop Domain:
                    </Text>
                    <input
                      type="text"
                      value={shop}
                      onChange={(e) => setShop(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="test-store.myshopify.com"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button onClick={simulateOAuth}>
                      Simulate OAuth & Start Onboarding
                    </Button>
                    
                    <Button variant="secondary" onClick={goToDashboard}>
                      Go to Dashboard
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Instructions:</strong>
                  </Text>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Enter a shop domain (e.g., test-store.myshopify.com)</li>
                    <li>Click "Simulate OAuth" to create a test merchant</li>
                    <li>You'll be redirected to the onboarding flow</li>
                    <li>Complete the 5-step onboarding process</li>
                    <li>You'll be redirected to the dashboard when done</li>
                  </ul>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 