'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Banner } from '@shopify/polaris';
import { useState } from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';

export default function InstallPage() {
  const [shopDomain, setShopDomain] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (!shopDomain) return;

    // Add .myshopify.com if not present
    const fullDomain = shopDomain.includes('.myshopify.com') 
      ? shopDomain 
      : `${shopDomain}.myshopify.com`;

    setIsInstalling(true);
    
    // Redirect to Shopify OAuth
    window.location.href = `/api/auth/shopify?shop=${fullDomain}`;
  };

  return (
    <Page title="Install SocialBoost">
      <Layout>
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <Text variant="headingLg" as="h2">
                    Welcome to SocialBoost
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    The complete influencer marketing solution for your Shopify store
                  </Text>
                </div>

                <Banner tone="info">
                  <Text variant="bodyMd" as="p">
                    <strong>What you&apos;ll get:</strong>
                  </Text>
                  <ul className="mt-2 space-y-1">
                    <li>• Influencer management with commission tracking</li>
                    <li>• UGC content approval and reward system</li>
                    <li>• Automated payouts via Stripe Connect</li>
                    <li>• Analytics dashboard and reporting</li>
                    <li>• Discount code generation and tracking</li>
                  </ul>
                </Banner>

                <div>
                  <Text variant="headingMd" as="h3">
                    Install on Your Store
                  </Text>
                  <div className="mt-4 space-y-4">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Enter your Shopify store domain:
                      </Text>
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="text"
                          value={shopDomain}
                          onChange={(e) => setShopDomain(e.target.value)}
                          placeholder="your-store"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">.myshopify.com</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleInstall}
                      disabled={!shopDomain || isInstalling}
                      icon={<ExternalLink className="w-4 h-4" />}
                    >
                      {isInstalling ? 'Installing...' : 'Install App'}
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <Text variant="bodySm" tone="subdued" as="p">
                    <strong>Need help?</strong> Contact us at{' '}
                    <a href="mailto:support@socialboost.com" className="text-blue-600 hover:underline">
                      support@socialboost.com
                    </a>
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