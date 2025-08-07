'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Page, Layout, Card, Text, Banner, InlineStack, Button } from '@shopify/polaris';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StripeConnectStatus {
  influencerId: string;
  accountId: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'ERROR';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: any;
}

export default function StripeConnectCompletePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const influencerId = params.id as string;
  const accountId = searchParams.get('account_id');

  useEffect(() => {
    async function completeStripeConnect() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/influencers/${influencerId}/stripe-connect/complete?account_id=${accountId}`, {
          headers: {
            'x-merchant-id': localStorage.getItem('merchantId') || '',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to complete Stripe Connect onboarding');
        }

        const data = await response.json();
        setStatus(data.data);
        
        // Auto-redirect after successful completion
        if (data.data?.status === 'ACTIVE') {
          setTimeout(() => {
            window.location.href = '/influencers';
          }, 3000); // Redirect after 3 seconds
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (influencerId && accountId) {
      completeStripeConnect();
    }
  }, [influencerId, accountId]);

  const getStatusIcon = () => {
    if (loading) return <Clock size={24} />;
    if (error) return <AlertCircle size={24} />;
    if (status?.status === 'ACTIVE') return <CheckCircle size={24} />;
    return <Clock size={24} />;
  };

  const getStatusTitle = () => {
    if (loading) return 'Setting up your Stripe Connect account...';
    if (error) return 'Connection Failed';
    if (status?.status === 'ACTIVE') return 'Stripe Connect Successful!';
    return 'Verification in Progress';
  };

  const getStatusDescription = () => {
    if (loading) return 'We\'re configuring your Stripe Connect account. This will just take a moment.';
    if (error) return error;
    if (status?.status === 'ACTIVE') return 'Your Stripe account is now connected and ready for payouts. You can now receive payments from merchants.';
    return 'Your account is being verified by Stripe. This usually takes 1-2 business days. You\'ll receive an email when verification is complete.';
  };

  const getBannerTone = () => {
    if (loading) return 'info';
    if (error) return 'critical';
    if (status?.status === 'ACTIVE') return 'success';
    return 'warning';
  };

  return (
    <Page title="Stripe Connect Complete">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <InlineStack align="center" gap="2">
                {getStatusIcon()}
                <Text variant="headingLg" as="h2">
                  {getStatusTitle()}
                </Text>
              </InlineStack>

              <div style={{ marginTop: '1rem' }}>
                <Banner tone={getBannerTone()}>
                  {getStatusDescription()}
                </Banner>
              </div>

              {status && (
                <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                  <Text variant="headingMd" as="h3">
                    Account Details
                  </Text>
                  <div style={{ marginTop: '1rem' }}>
                    <Text variant="bodyMd" as="p">
                      <strong>Account ID:</strong> {status.accountId}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Charges Enabled:</strong> {status.chargesEnabled ? 'Yes' : 'No'}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Payouts Enabled:</strong> {status.payoutsEnabled ? 'Yes' : 'No'}
                    </Text>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <Text variant="bodyMd" as="span" tone="subdued">
                      Processing...
                    </Text>
                  </div>
                ) : status?.status === 'ACTIVE' ? (
                  <div className="space-y-2">
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Redirecting to Influencers page in 3 seconds...
                    </Text>
                    <Button
                      primary
                      url="/influencers"
                    >
                      Go to Influencers Now
                    </Button>
                  </div>
                ) : (
                  <Button
                    primary
                    url="/influencers"
                  >
                    Back to Influencers
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 