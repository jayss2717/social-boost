'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Page, Layout, Card, Text, Banner, InlineStack, Button } from '@shopify/polaris';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function StripeConnectRefreshPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const influencerId = params.id as string;

  useEffect(() => {
    async function refreshStripeConnect() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/influencers/${influencerId}/stripe-connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-merchant-id': localStorage.getItem('merchantId') || '',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh Stripe Connect link');
        }

        const data = await response.json();
        setOnboardingUrl(data.data.onboardingUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (influencerId) {
      refreshStripeConnect();
    }
  }, [influencerId]);

  const handleContinueOnboarding = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl;
    }
  };

  return (
    <Page title="Stripe Connect Refresh">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <InlineStack align="center" gap="2">
                {loading ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : error ? (
                  <AlertCircle size={24} />
                ) : (
                  <CheckCircle size={24} />
                )}
                <Text variant="headingLg" as="h2">
                  {loading ? 'Refreshing Stripe Connect...' : error ? 'Refresh Failed' : 'New Link Generated'}
                </Text>
              </InlineStack>

              <div style={{ marginTop: '1rem' }}>
                <Banner tone={error ? 'critical' : loading ? 'info' : 'success'}>
                  {loading 
                    ? 'Please wait while we generate a new Stripe Connect onboarding link.'
                    : error 
                    ? error
                    : 'A new Stripe Connect onboarding link has been generated. Click the button below to continue.'
                  }
                </Banner>
              </div>

              {onboardingUrl && !loading && !error && (
                <div style={{ marginTop: '2rem' }}>
                  <Button
                    primary
                    onClick={handleContinueOnboarding}
                  >
                    Continue Onboarding
                  </Button>
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                <Button
                  url="/influencers"
                >
                  Back to Influencers
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 