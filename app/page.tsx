'use client';

import { Page, Layout, Card, Text, Button, Badge, DataTable } from '@shopify/polaris';
import { useMerchantId } from '@/hooks/useMerchantId';
import { useMerchantData } from '@/hooks/useMerchantData';
import { useMetrics } from '@/hooks/useMetrics';
import { UsageMeter } from '@/components/UsageMeter';
import { UsageWarning } from '@/components/UsageWarning';
import { useState, useEffect } from 'react';
import { withHost } from '@/utils/withHost';
export default function DashboardPage() {
  const merchantId = useMerchantId();
  const { data: metrics } = useMetrics();
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Get shop from URL params
  const [shop, setShop] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    const hostParam = urlParams.get('host');
    setShop(shopParam);
    setHost(hostParam);
  }, []);
  
  // Use the new merchant data hook
  const { merchantData, isOAuthCompleted } = useMerchantData(shop || undefined);

  // Check for new installations and redirect to onboarding
  useEffect(() => {
    const checkForNewInstallation = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      const paymentSuccess = urlParams.get('payment_success');
      
      if (shop && !merchantId && !isRedirecting) {
        console.log('New installation detected, checking merchant status...');
        setIsRedirecting(true);
        
        try {
          const response = await fetch(`/api/merchant?shop=${shop}`);
          if (response.ok) {
            const merchantData = await response.json();
            
            // Store merchant ID in localStorage
            localStorage.setItem('merchantId', merchantData.id);
            
            // If payment was successful, force complete onboarding
            if (paymentSuccess === 'true') {
              console.log('Payment successful, completing onboarding...');
              try {
                await fetch('/api/merchant/complete-onboarding', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ merchantId: merchantData.id }),
                });
                console.log('Onboarding completed after payment');
                // Clear the payment_success parameter to avoid redirect loops
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('payment_success');
                window.history.replaceState({}, '', newUrl.toString());
              } catch (error) {
                console.error('Failed to complete onboarding after payment:', error);
              }
            }
            
            // Only redirect to onboarding if this is truly a new merchant or onboarding not completed
            if (merchantData._newMerchant || (!merchantData.onboardingCompleted && !paymentSuccess)) {
              console.log('Redirecting to onboarding...');
              const onboardingUrl = withHost('/onboarding', { shop: shop || '', host: host || '' });
              window.location.href = onboardingUrl;
              return;
            } else {
              console.log('Onboarding already completed, showing dashboard');
            }
          }
        } catch (error) {
          console.error('Error checking merchant status:', error);
        }
        
        setIsRedirecting(false);
      }
    };

    checkForNewInstallation();
  }, [merchantId, isRedirecting, host]);

  // Show loading state while redirecting or OAuth is in progress
  if (isRedirecting || (merchantData && !isOAuthCompleted)) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <Text variant="headingLg" as="h2">
                  Setting up your SocialBoost account...
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  {isRedirecting ? 'Checking your account status...' : 'We\'re configuring your Shopify integration. This will just take a moment.'}
                </Text>
                <div style={{ marginTop: '2rem' }}>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="secondary"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (!merchantId) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="h2">
                  Welcome to SocialBoost
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Complete Shopify integration for influencer marketing
                </Text>
                <div style={{ marginTop: '1rem' }}>
                  <Button variant="primary" url="/onboarding">
                    Get Started
                  </Button>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Dashboard">
      <Layout>
        {/* Welcome Section */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Text variant="headingLg" as="h2">
                  Welcome to SocialBoost
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Complete Shopify integration with real discount codes, automated webhooks, and comprehensive analytics.
                </Text>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge tone="success">Real Shopify Integration</Badge>
                  <Badge tone="success">Automated Webhooks</Badge>
                  <Badge tone="success">Usage Tracking</Badge>
                  <Badge tone="success">Revenue Analytics</Badge>
                </div>

                {/* Show helpful message for new accounts */}
                {metrics && metrics.summary.totalUsage === 0 && metrics.summary.influencerCount === 0 && (
                  <div style={{ 
                    backgroundColor: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    marginTop: '1rem' 
                  }}>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      🚀 <strong>Next Steps:</strong> Start by adding your first influencer or connecting your social media accounts to detect brand mentions automatically.
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Usage Warnings */}
        <Layout.Section>
          <UsageWarning type="ugc" />
          <UsageWarning type="influencer" />
        </Layout.Section>

        {/* Usage Overview */}
        <Layout.Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <UsageMeter type="ugc" showDetails={showDetailedMetrics} />
            <UsageMeter type="influencer" showDetails={showDetailedMetrics} />
          </div>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Text variant="headingMd" as="h3">Quick Actions</Text>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <Button url={withHost('/influencers', { shop: shop || '', host: host || '' })} variant="primary">
                    Manage Influencers
                  </Button>
                  <Button url={withHost('/ugc', { shop: shop || '', host: host || '' })}>
                    View UGC Posts
                  </Button>
                  <Button url={withHost('/payouts', { shop: shop || '', host: host || '' })}>
                    Process Payouts
                  </Button>
                  <Button url={withHost('/settings', { shop: shop || '', host: host || '' })}>
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Performance Metrics */}
        {metrics && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headingMd" as="h3">Performance Overview</Text>
                    <Button
                      size="slim"
                      onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
                    >
                      {showDetailedMetrics ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>

                  {/* Show helpful message for new accounts */}
                  {metrics.summary.totalUsage === 0 && metrics.summary.influencerCount === 0 && (
                    <div style={{ 
                      backgroundColor: '#f0f9ff', 
                      border: '1px solid #0ea5e9', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      marginBottom: '1rem' 
                    }}>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        🎉 Welcome to SocialBoost! Your metrics will appear here once you start working with influencers and creating discount codes. 
                        Get started by adding your first influencer or connecting your social media accounts.
                      </Text>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Text variant="headingLg" as="p" tone="success">
                        ${(metrics.summary.totalRevenue / 100).toFixed(2)}
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Total Revenue
                      </Text>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <Text variant="headingLg" as="p" tone="success">
                        {metrics.summary.totalUsage}
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Code Uses
                      </Text>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <Text variant="headingLg" as="p" tone="success">
                        {(metrics.performance.conversionRate * 100).toFixed(1)}%
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Conversion Rate
                      </Text>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <Text variant="headingLg" as="p" tone="success">
                        ${(metrics.performance.averageOrderValue / 100).toFixed(2)}
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Avg Order Value
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Recent Activity */}
        {metrics?.recentActivity && metrics.recentActivity.length > 0 && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Text variant="headingMd" as="h3">Recent Activity</Text>
                  
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                    headings={['Code', 'Influencer', 'Discount', 'Created', 'Status']}
                    rows={metrics.recentActivity.slice(0, 5).map((activity) => [
                      activity.code,
                      activity.influencerName,
                      `${activity.discountValue}${activity.discountType === 'PERCENTAGE' ? '%' : '$'} off`,
                      new Date(activity.createdAt).toLocaleDateString(),
                      'Active'
                    ])}
                  />
                </div>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Integration Status */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Text variant="headingMd" as="h3">Integration Status</Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" as="p">Shopify Connection</Text>
                    <Badge tone="success">Connected</Badge>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" as="p">Webhook Processing</Text>
                    <Badge tone="success">Active</Badge>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" as="p">Discount Code Creation</Text>
                    <Badge tone="success">Real-time</Badge>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" as="p">Usage Analytics</Text>
                    <Badge tone="success">Tracking</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Feature Highlights */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Text variant="headingMd" as="h3">Complete Shopify Integration</Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      ✅ Real Discount Code Creation
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Create actual discount codes in Shopify that customers can use at checkout
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      ✅ Automated Webhook Processing
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Real-time order processing with automatic commission calculations
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      ✅ Comprehensive Usage Tracking
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Track revenue, conversion rates, and performance metrics
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      ✅ Influencer Commission Management
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Automatic payout creation and commission tracking
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}