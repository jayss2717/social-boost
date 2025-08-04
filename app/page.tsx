'use client';

import { Page, Layout, Card, Text, Button, Badge, DataTable } from '@shopify/polaris';
import { useMerchantId } from '@/hooks/useMerchantId';
import { useMerchantData } from '@/hooks/useMerchantData';
import { useMetrics } from '@/hooks/useMetrics';
import { UsageMeter } from '@/components/UsageMeter';
import { UsageWarning } from '@/components/UsageWarning';
import { useState, useEffect, useCallback } from 'react';
import { withHost } from '@/utils/withHost';
import { useSubscription } from '@/hooks/useSubscription';
import { useShop } from '@/hooks/useShop';

export default function DashboardPage() {
  // Get merchant ID from localStorage or URL params
  const merchantId = useMerchantId();
  const shop = useShop();

  // Fallback: If we have a shop but no merchant ID, try to get it
  useEffect(() => {
    if (shop && !merchantId) {
      console.log('Shop detected but no merchant ID, attempting to fetch...');
      const fetchMerchantId = async () => {
        try {
          const response = await fetch(`/api/merchant?shop=${shop}`);
          if (response.ok) {
            const merchantData = await response.json();
            localStorage.setItem('merchantId', merchantData.id);
            window.dispatchEvent(new CustomEvent('merchantIdSet', { 
              detail: merchantData.id 
            }));
            console.log('Merchant ID fetched and set:', merchantData.id);
          }
        } catch (error) {
          console.error('Error fetching merchant ID:', error);
        }
      };
      
      fetchMerchantId();
    }
  }, [shop, merchantId]);
  
  const { data: metrics } = useMetrics();
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  
  // Get host from URL params
  const [host, setHost] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hostParam = urlParams.get('host');
    setHost(hostParam);
  }, []);
  
  // Use the new merchant data hook
  const { merchantData, isOAuthCompleted } = useMerchantData(shop || undefined);
  const { mutate: mutateSubscription } = useSubscription();

  // Handle payment success processing
  const processPaymentSuccess = useCallback(async (shop: string) => {
    if (paymentProcessed) return; // Prevent duplicate processing
    
    console.log('✅ Processing payment success for shop:', shop);
    setPaymentProcessed(true);
    
    try {
      // First, complete onboarding
      const onboardingResponse = await fetch('/api/merchant/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop }),
      });
      
      if (onboardingResponse.ok) {
        console.log('Onboarding completed after payment');
        
        // Then verify subscription
        const verifyResponse = await fetch(`/api/subscription/verify?shop=${shop}`, {
          method: 'POST',
        });
        
        if (verifyResponse.ok) {
          const data = await verifyResponse.json();
          console.log('Subscription verification result:', data);
          if (data.success && mutateSubscription) {
            mutateSubscription();
          }
        }
      }
      
      // Clear the payment_success parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_success');
      window.history.replaceState({}, '', newUrl.toString());
      
    } catch (error) {
      console.error('Failed to process payment success:', error);
    }
  }, [paymentProcessed, mutateSubscription]);

  // Check for payment success and new installations
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const shop = urlParams.get('shop');

    console.log('🔍 Main page check:', {
      paymentSuccess,
      shop,
      currentUrl: window.location.href,
      isIframe: window !== window.top,
      paymentProcessed,
      merchantId,
      isRedirecting
    });

    if (paymentSuccess === 'true' && shop && !paymentProcessed) {
      processPaymentSuccess(shop);
      return; // Don't proceed with other checks if processing payment
    }

    // Check for new installations and redirect to onboarding
    if (shop && !merchantId && !isRedirecting && !paymentProcessed) {
      console.log('New installation detected, checking merchant status...');
      setIsRedirecting(true);
      
      const checkMerchantStatus = async () => {
        try {
          const response = await fetch(`/api/merchant?shop=${shop}`);
          if (response.ok) {
            const merchantData = await response.json();
            
            console.log('Merchant data received:', {
              id: merchantData.id,
              shop: merchantData.shop,
              onboardingCompleted: merchantData.onboardingCompleted,
            });
            
            // Store merchant ID in localStorage
            localStorage.setItem('merchantId', merchantData.id);
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('merchantIdSet', { 
              detail: merchantData.id 
            }));
            
            console.log('Merchant ID set in localStorage:', merchantData.id);
            
            // Only redirect to onboarding if not a new merchant and onboarding not completed
            if (merchantData._newMerchant || !merchantData.onboardingCompleted) {
              console.log('Redirecting to onboarding...');
              window.location.href = `/onboarding?shop=${shop}`;
            }
          } else {
            console.error('Failed to fetch merchant data:', response.status);
          }
        } catch (error) {
          console.error('Error checking merchant status:', error);
        } finally {
          setIsRedirecting(false);
        }
      };
      
      checkMerchantStatus();
    }
  }, [shop, merchantId, isRedirecting, paymentProcessed, processPaymentSuccess]);

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