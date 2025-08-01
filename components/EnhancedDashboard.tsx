'use client';

import { Page, Layout, Card, Text, Badge, Button, Grid, Spinner, BlockStack, Banner } from '@shopify/polaris';
import { Users, Hash, Gift, DollarSign, TrendingUp, Clock, Package, ShoppingCart, User } from 'lucide-react';
import { useShopifyData } from '@/hooks/useShopifyData';
import { useSubscription } from '@/hooks/useSubscription';
import PaywallModal from '@/components/PaywallModal';
import { useState } from 'react';
import React from 'react';

interface EnhancedDashboardProps {
  shop?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

export default function EnhancedDashboard({ shop }: EnhancedDashboardProps) {
  const { shopifyData, isLoading, error, mutate } = useShopifyData(shop);
  const { data: subscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

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
                      Loading real-time data from Shopify...
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

  if (error) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Data Loading Error
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Unable to load real-time data from Shopify. This might be due to OAuth issues or network problems.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => mutate()}>
                      Retry Loading
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

  // Shopify Store Metrics
  const shopifyMetrics: MetricCard[] = [
    {
      title: 'Total Products',
      value: shopifyData?.productsCount || 0,
      icon: Package,
      color: 'success',
      description: 'Products in your store'
    },
    {
      title: 'Recent Orders',
      value: shopifyData?.recentOrdersCount || 0,
      icon: ShoppingCart,
      color: 'info',
      description: 'Orders in last 30 days'
    },
    {
      title: 'Total Customers',
      value: shopifyData?.customersCount || 0,
      icon: User,
      color: 'success',
      description: 'Registered customers'
    },
    {
      title: 'Recent Revenue',
      value: shopifyData?.recentRevenue ? `$${Math.round(shopifyData.recentRevenue)}` : '$0',
      icon: DollarSign,
      color: 'success',
      description: 'Revenue in last 30 days'
    }
  ];

  // App Metrics
  const appMetrics: MetricCard[] = [
    {
      title: 'Total UGC Posts',
      value: shopifyData?.appMetrics?.totalUgcPosts || 0,
      icon: Hash,
      color: 'success',
      description: 'User-generated content'
    },
    {
      title: 'Active Influencers',
      value: shopifyData?.appMetrics?.activeInfluencers || 0,
      icon: Users,
      color: 'info',
      description: 'Connected influencers'
    },
    {
      title: 'Approved Posts',
      value: shopifyData?.appMetrics?.approvedPosts || 0,
      icon: TrendingUp,
      color: 'success',
      description: 'Approved content'
    },
    {
      title: 'Pending Approval',
      value: shopifyData?.appMetrics?.pendingApproval || 0,
      icon: Clock,
      color: 'attention',
      description: 'Awaiting review'
    },
    {
      title: 'Pending Payouts',
      value: shopifyData?.appMetrics?.pendingPayouts ? `$${Math.round(shopifyData.appMetrics.pendingPayouts / 100)}` : '$0',
      icon: Gift,
      color: 'warning',
      description: 'Outstanding payments'
    }
  ];

  const renderMetricCard = (metric: MetricCard, index: number) => {
    const IconComponent = metric.icon;
    return (
      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 4, lg: 4, xl: 4 }} key={index}>
        <Card>
          <div className="p-6">
            <BlockStack gap="400">
              <div className="flex items-center space-x-3">
                {React.createElement(IconComponent, { className: "w-6 h-6 text-sb-primary" })}
                <div>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    {metric.title}
                  </Text>
                  <Text variant="headingLg" as="h3">
                    {metric.value}
                  </Text>
                </div>
              </div>
              <Text variant="bodySm" tone="subdued" as="p">
                {metric.description}
              </Text>
            </BlockStack>
          </div>
        </Card>
      </Grid.Cell>
    );
  };

  return (
    <Page title="Dashboard">
      <Layout>
        {/* Store Information */}
        {shopifyData?.shop && (
          <Layout.Section>
            <Card>
              <div className="p-6">
                <BlockStack gap="400">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="headingLg" as="h2">
                        {shopifyData.shop.name}
                      </Text>
                      <Text variant="bodyMd" tone="subdued" as="p">
                        {shopifyData.shop.domain} • {shopifyData.shop.currency} • {shopifyData.shop.timezone}
                      </Text>
                    </div>
                    <Badge tone="success">Connected</Badge>
                  </div>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Shopify Store Metrics */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  Store Performance
                </Text>
                <Grid>
                  {shopifyMetrics.map(renderMetricCard)}
                </Grid>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* App Metrics */}
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  SocialBoost Performance
                </Text>
                <Grid>
                  {appMetrics.map(renderMetricCard)}
                </Grid>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Usage Limits */}
        {isOverLimit && (
          <Layout.Section>
            <Banner tone="warning">
                                <Text variant="bodyMd" as="p">
                    You&apos;re approaching your plan limits. Consider upgrading to unlock more features.
                  </Text>
              <div className="mt-2">
                <Button variant="primary" onClick={() => setShowPaywall(true)}>
                  Upgrade Plan
                </Button>
              </div>
            </Banner>
          </Layout.Section>
        )}


      </Layout>

      <PaywallModal 
        open={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onSubscribe={(planId, billingCycle) => {
          console.log('Subscribing to plan:', planId, billingCycle);
          setShowPaywall(false);
        }}
        usage={usage}
      />
    </Page>
  );
} 