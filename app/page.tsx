'use client';

import { Page, Layout, Card, Text, Badge, Button, Grid, Spinner, BlockStack, Banner } from '@shopify/polaris';
import { Users, Hash, Gift, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/PaywallModal';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useMetrics();
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const isLoading = metricsLoading || subscriptionLoading;

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Get shop from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop') || localStorage.getItem('shop');
        
        if (shop) {
          const response = await fetch(`/api/merchant?shop=${shop}`);
          if (response.ok) {
            const data = await response.json();
            
            // Redirect to onboarding if not completed
            if (!data.onboardingCompleted) {
              window.location.href = `/onboarding?shop=${shop}`;
            }
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="flex justify-center items-center h-64">
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Handle errors gracefully
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
      value: `$${(metrics?.totalRevenue || 0) / 100}`,
      icon: DollarSign,
      color: 'success',
    },
    {
      title: 'Pending Payouts',
      value: `$${(metrics?.pendingPayouts || 0) / 100}`,
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
            {metricCards.map((card, index) => (
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 4, lg: 4, xl: 4 }} key={index}>
                <Card>
                  <div className="p-6">
                    <BlockStack gap="400">
                      <div className="flex items-center space-x-3">
                        <card.icon className="w-6 h-6 text-sb-primary" />
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
            ))}
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

        {metrics?.topPosts && metrics.topPosts.length > 0 && (
          <Layout.Section>
            <Card>
              <div className="p-6">
                <Text variant="headingMd" as="h3">
                  Top Performing Posts
                </Text>
                <div className="mt-4 space-y-2">
                  {metrics.topPosts.slice(0, 3).map((post: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <Text variant="bodyMd" as="p">
                          {post.platform} - {post.influencerName}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {post.content}
                        </Text>
                      </div>
                      <Badge tone="success">
                        {`${post.engagement} engagement`}
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
          usage={usage}
          plans={subscription?.plans}
        />
      )}
    </Page>
  );
} 