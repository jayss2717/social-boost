'use client';

import { Page, Layout, Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function BillingContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'canceled' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const failed = searchParams.get('failed');
    const error = searchParams.get('error');
    const shop = searchParams.get('shop');

    if (success) {
      setStatus('success');
      
      // Update merchant onboarding status after successful payment
      const updateMerchantStatus = async () => {
        try {
          const merchantId = localStorage.getItem('merchantId');
          if (merchantId) {
            const response = await fetch('/api/merchant/complete-onboarding', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ merchantId }),
            });
            
            if (response.ok) {
              console.log('Merchant onboarding status updated after payment');
            }
          }
        } catch (error) {
          console.error('Failed to update merchant status:', error);
        }
      };
      
      updateMerchantStatus();
      
      // Redirect to dashboard with payment success parameter
      setTimeout(() => {
        // Always redirect directly to the dashboard URL that works in iframe
        const dashboardUrl = shop ? `/?shop=${shop}&payment_success=true` : '/?payment_success=true';
        console.log('🔄 Redirecting to dashboard:', dashboardUrl);
        
        // In Shopify admin context, redirect the top window
        if (window !== window.top && window.top !== null) {
          window.top!.location.href = dashboardUrl;
        } else {
          // Direct access, redirect current window
          window.location.href = dashboardUrl;
        }
      }, 1000); // Reduced timeout for faster redirect
    } else if (canceled) {
      setStatus('canceled');
      // Redirect back to dashboard
      setTimeout(() => {
        // Always redirect directly to the dashboard URL
        const dashboardUrl = shop ? `/?shop=${shop}` : '/';
        console.log('🔄 Redirecting to dashboard (canceled):', dashboardUrl);
        
        // In Shopify admin context, redirect the top window
        if (window !== window.top && window.top !== null) {
          window.top!.location.href = dashboardUrl;
        } else {
          // Direct access, redirect current window
          window.location.href = dashboardUrl;
        }
      }, 1000); // Reduced timeout for faster redirect
    } else if (failed || error) {
      setStatus('failed');
      setErrorMessage(error || 'Payment failed. Please try again.');
      
      // Redirect back to dashboard after showing error
      setTimeout(() => {
        // Always redirect directly to the dashboard URL
        const dashboardUrl = shop ? `/?shop=${shop}` : '/';
        console.log('🔄 Redirecting to dashboard (failed):', dashboardUrl);
        
        // In Shopify admin context, redirect the top window
        if (window !== window.top && window.top !== null) {
          window.top!.location.href = dashboardUrl;
        } else {
          // Direct access, redirect current window
          window.location.href = dashboardUrl;
        }
      }, 3000); // Give user time to read error message
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
            <Button 
              variant="primary" 
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                const shop = urlParams.get('shop');
                window.location.href = `/?shop=${shop}`;
              }}
            >
              Return to Dashboard
            </Button>
          </div>
        </BlockStack>
      ) : status === 'failed' ? (
        <BlockStack gap="400">
          <Text variant="headingLg" as="h2" tone="critical">
            Payment Failed
          </Text>
          <Text variant="bodyMd" tone="subdued" as="p">
            {errorMessage || 'There was an issue processing your payment. Please try again.'}
          </Text>
          <Text variant="bodyMd" tone="subdued" as="p">
            You can upgrade your plan later from the dashboard.
          </Text>
          <div className="mt-4">
            <Button 
              variant="primary" 
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                const shop = urlParams.get('shop');
                window.location.href = `/?shop=${shop}`;
              }}
            >
              Return to Dashboard
            </Button>
          </div>
        </BlockStack>
      ) : (
        <BlockStack gap="400">
          <Text variant="headingLg" as="h2">
            Payment Canceled
          </Text>
          <Text variant="bodyMd" tone="subdued" as="p">
            Your payment was canceled. You can upgrade your plan later from the dashboard.
          </Text>
          <div className="mt-4">
            <Button 
              variant="primary" 
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                const shop = urlParams.get('shop');
                window.location.href = `/?shop=${shop}`;
              }}
            >
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