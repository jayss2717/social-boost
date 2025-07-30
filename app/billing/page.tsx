'use client';

import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'canceled' | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      setStatus('success');
    } else if (canceled) {
      setStatus('canceled');
    }
  }, [searchParams]);

  if (!status) {
    return (
      <Page title="Billing">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Text variant="bodyMd" tone="subdued" as="p">
                  Redirecting...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Billing">
      <Layout>
        <Layout.Section>
          <Card>
            <div className="p-6 text-center">
              {status === 'success' ? (
                <BlockStack gap="400">
                  <Text variant="headingLg" as="h2">
                    Subscription Updated Successfully!
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Your plan has been upgraded and you now have access to additional features.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" url="/">
                      Return to Dashboard
                    </Button>
                  </div>
                </BlockStack>
              ) : (
                <BlockStack gap="400">
                  <Text variant="headingLg" as="h2">
                    Subscription Update Canceled
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Your subscription remains unchanged. You can upgrade at any time from the dashboard.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" url="/">
                      Return to Dashboard
                    </Button>
                  </div>
                </BlockStack>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 