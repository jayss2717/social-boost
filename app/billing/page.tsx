'use client';

import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function BillingContent() {
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
      <div className="p-6 text-center">
        <Text variant="bodyMd" tone="subdued" as="p">
          Redirecting...
        </Text>
      </div>
    );
  }

  return (
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
  );
}

export default function BillingPage() {
  return (
    <Page title="Billing">
      <Layout>
        <Layout.Section>
          <Card>
            <Suspense fallback={
              <div className="p-6 text-center">
                <Text variant="bodyMd" tone="subdued" as="p">
                  Loading...
                </Text>
              </div>
            }>
              <BillingContent />
            </Suspense>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 