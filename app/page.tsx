'use client';

import { Page, Layout, Card, Text, Badge, Button, Grid, Spinner, BlockStack, Banner } from '@shopify/polaris';
import { Users, Hash, Gift, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useSubscription } from '@/hooks/useSubscription';
import PaywallModal from '@/components/PaywallModal';
import { useState, useEffect } from 'react';
import React from 'react';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useMetrics();
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const isLoading = metricsLoading || subscriptionLoading || isCheckingOnboarding;

  // Ensure client-side rendering to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Error boundary for React errors
  useEffect(() => {
    if (!isClient) return;

    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isClient]);

  // Check onboarding status
  useEffect(() => {
    if (!isClient) return;

    const checkOnboarding = async () => {
      try {
        // Get shop from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop') || localStorage.getItem('shop');
        
        console.log('Checking onboarding for shop:', shop);
        
        // For testing purposes, always redirect to onboarding if no shop is provided
        if (!shop) {
          console.log('No shop provided, redirecting to test onboarding...');
          window.location.href = '/test-onboarding';
          return;
        }
        
        if (shop) {
          try {
            // First check if merchant exists and has valid credentials
            const response = await fetch(`/api/merchant?shop=${shop}`);
            if (response.ok) {
              let data;
              try {
                data = await response.json();
                console.log('Merchant data:', data);
                console.log('Data type:', typeof data);
                console.log('Data keys:', Object.keys(data));
                console.log('onboardingCompleted:', data.onboardingCompleted, typeof data.onboardingCompleted);
              } catch (jsonError) {
                console.error('Failed to parse merchant response:', jsonError);
                setOnboardingError('Invalid response from server');
                setIsCheckingOnboarding(false);
                return;
              }
              
              // Handle both success and error responses
              if (data.error) {
                console.error('Merchant API error:', data.error);
                setOnboardingError('Failed to load merchant data');
                setIsCheckingOnboarding(false);
                return;
              }
              
              // Store merchant ID in localStorage for API calls
              if (data.id) {
                localStorage.setItem('merchantId', data.id);
                localStorage.setItem('shop', shop);
                console.log('Stored merchant ID:', data.id);
                console.log('Stored shop:', shop);
                
                // Check if credentials are valid
                if (data.accessToken === 'pending' || !data.shopifyShopId) {
                  console.log('⚠️ Invalid credentials detected, redirecting to OAuth...');
                  window.location.href = `/api/auth/shopify?shop=${shop}`;
                  return;
                }
                
                // Dispatch custom event to notify hooks that merchantId is available
                window.dispatchEvent(new CustomEvent('merchantIdSet', { detail: data.id }));
              } else {
                console.error('No merchant ID in response:', data);
                setOnboardingError('Invalid merchant data received');
                setIsCheckingOnboarding(false);
                return;
              }
              
              // Redirect to onboarding if not completed
              if (!data.onboardingCompleted) {
                console.log('Redirecting to onboarding...', { shop, onboardingCompleted: data.onboardingCompleted });
                try {
                  window.location.href = `/onboarding?shop=${shop}`;
                } catch (redirectError) {
                  console.error('Failed to redirect to onboarding:', redirectError);
                  setOnboardingError('Failed to redirect to onboarding');
                  setIsCheckingOnboarding(false);
                }
                return; // Don't set isCheckingOnboarding to false if redirecting
              } else {
                console.log('Onboarding already completed, staying on dashboard');
              }
            } else if (response.status === 404) {
              // Merchant not found, redirect to onboarding
              console.log('Merchant not found (404), redirecting to onboarding...');
              window.location.href = `/onboarding?shop=${shop}`;
              return;
            }
          } catch (error) {
            console.error('Failed to fetch merchant data:', error);
            setOnboardingError('Failed to check onboarding status');
            // If database is not available, try test API
            console.log('Database not available, trying test API...');
            try {
              const testResponse = await fetch(`/api/test/onboarding-check?shop=${shop}`);
              if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('Test merchant data:', testData);
                
                if (!testData.onboardingCompleted) {
                  console.log('Redirecting to test onboarding...');
                  window.location.href = '/test-onboarding';
                  return;
                }
              }
            } catch (testError) {
              console.error('Test API also failed:', testError);
              setOnboardingError('Failed to connect to backend services');
              // Final fallback - stay on dashboard with error
              console.log('All APIs failed, staying on dashboard with error state');
            }
          }
        }
        
        // Set to false if we're not redirecting
        setIsCheckingOnboarding(false);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setOnboardingError('An unexpected error occurred');
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isClient]);

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Spinner size="large" />
                  <div className="mt-4">
                    <Text variant="bodyMd" as="p">
                      Initializing...
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Spinner size="large" />
                  <div className="mt-4">
                    <Text variant="bodyMd" as="p">
                      {isCheckingOnboarding ? 'Checking onboarding status...' : 'Loading dashboard...'}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Handle onboarding errors
  if (onboardingError) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Setup Required
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    {onboardingError}. Please complete the setup process to continue.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => window.location.reload()}>
                      Retry Setup
                    </Button>
                  </div>
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Handle React errors gracefully
  if (hasError) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Application Error
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Something went wrong with the application. Please refresh the page to try again.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                  </div>
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Handle API errors gracefully
  if (subscriptionError || metricsError) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Connection Error
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Unable to connect to the backend. Please check your connection and try again.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => window.location.reload()}>
                      Retry Connection
                    </Button>
                  </div>
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Provide default values for usage
  const usage = subscription?.usage || {
    ugcCount: 0,
    influencerCount: 0,
    ugcLimit: 20,
    influencerLimit: 5,
  };

  const isOverLimit = (
    (usage.ugcCount >= usage.ugcLimit && usage.ugcLimit !== -1) ||
    (usage.influencerCount >= usage.influencerLimit && usage.influencerLimit !== -1)
  );

  const metricCards = [
    {
      title: 'Total UGC Posts',
      value: metrics?.totalUgcPosts || 0,
      icon: Hash,
      color: 'success',
    },
    {
      title: 'Active Influencers',
      value: metrics?.totalInfluencers || 0,
      icon: Users,
      color: 'info',
    },
    {
      title: 'Total Revenue',
      value: `$${Math.round((metrics?.totalRevenue || 0) / 100)}`,
      icon: DollarSign,
      color: 'success',
    },
    {
      title: 'Pending Payouts',
      value: `$${Math.round((metrics?.pendingPayouts || 0) / 100)}`,
      icon: Gift,
      color: 'warning',
    },
    {
      title: 'Approved Posts',
      value: metrics?.approvedPosts || 0,
      icon: TrendingUp,
      color: 'success',
    },
    {
      title: 'Pending Approval',
      value: metrics?.pendingApproval || 0,
      icon: Clock,
      color: 'attention',
    },
  ];

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Grid>
            {metricCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 4, lg: 4, xl: 4 }} key={index}>
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <div className="flex items-center space-x-3">
                          {React.createElement(IconComponent, { className: "w-6 h-6 text-sb-primary" })}
                          <div>
                            <Text variant="bodyMd" tone="subdued" as="p">
                              {card.title}
                            </Text>
                            <Text variant="headingLg" as="h2">
                              {card.value}
                            </Text>
                          </div>
                        </div>
                      </BlockStack>
                    </div>
                  </Card>
                </Grid.Cell>
              );
            })}
          </Grid>
        </Layout.Section>

        {isOverLimit && (
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="warning">
                  <Text variant="headingLg" as="h2">
                    You&apos;ve reached your plan limits
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Upgrade your plan to continue growing your influencer marketing program
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => setShowPaywall(true)}>
                      Upgrade Plan
                    </Button>
                  </div>
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <div className="p-6">
              <Text variant="headingMd" as="h3">
                Recent Activity
              </Text>
              {metrics?.recentActivity ? (
                <Text variant="bodyMd" as="span">
                  {metrics.recentActivity} new posts in the last 7 days
                </Text>
              ) : (
                <Text variant="bodyMd" tone="subdued" as="p">
                  No recent activity to display
                </Text>
              )}
            </div>
          </Card>
        </Layout.Section>

        {metrics?.topPosts && Array.isArray(metrics.topPosts) && metrics.topPosts.length > 0 && (
          <Layout.Section>
            <Card>
              <div className="p-6">
                <Text variant="headingMd" as="h3">
                  Top Performing Posts
                </Text>
                <div className="mt-4 space-y-2">
                  {metrics.topPosts.slice(0, 3).map((post: Record<string, unknown>, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <Text variant="bodyMd" as="p">
                          {String(post.platform || 'Unknown')} - {String(post.influencerName || 'Unknown')}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {String(post.content || 'No content')}
                        </Text>
                      </div>
                      <Badge tone="success">
                        {`${post.engagement || 0} engagement`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {showPaywall && (
        <PaywallModal
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSubscribe={(planId, billingCycle) => {
            console.log('Subscribing to plan:', planId, billingCycle);
            setShowPaywall(false);
          }}
          usage={usage}
        />
      )}
    </Page>
  );
}