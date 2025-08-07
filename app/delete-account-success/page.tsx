'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Banner } from '@shopify/polaris';
import { CheckCircle, ExternalLink } from 'lucide-react';
import React from 'react';

export default function DeleteAccountSuccessPage() {
  const handleUninstallApp = () => {
    // Redirect to Shopify admin to uninstall the app
    const shop = localStorage.getItem('shop') || 'your-store.myshopify.com';
    window.open(`https://${shop}/admin/apps`, '_blank');
  };

  return (
    <Page title="Account Deleted Successfully">
      <Layout>
        <Layout.Section>
          <Card>
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <BlockStack gap="400">
                <div>
                  <Text variant="headingLg" as="h1">
                    Account Deleted Successfully
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p" className="mt-2">
                    Your SocialBoost account and all associated data have been permanently removed.
                  </Text>
                </div>

                <Banner tone="info">
                  <p>
                    <strong>Next Steps:</strong> To completely remove SocialBoost from your Shopify store, 
                    you should also uninstall the app from your Shopify admin.
                  </p>
                </Banner>

                <div className="space-y-4">
                  <Button
                    primary
                    onClick={handleUninstallApp}
                    icon={() => React.createElement(ExternalLink, { className: "w-4 h-4" })}
                  >
                    Uninstall App from Shopify
                  </Button>

                  <Text variant="bodySm" tone="subdued" as="p">
                    If you want to use SocialBoost again in the future, you can reinstall the app from the Shopify App Store.
                  </Text>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 