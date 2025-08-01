'use client';

import { Page, Layout, Card, Text, Button, Badge, DataTable } from '@shopify/polaris';
import { useMerchantId } from '@/hooks/useMerchantId';
import { useMetrics } from '@/hooks/useMetrics';
import { UsageMeter } from '@/components/UsageMeter';
import { useState } from 'react';

export default function DashboardPage() {
  const merchantId = useMerchantId();
  const { data: metrics } = useMetrics();
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);

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
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Usage Overview */}
        <Layout.Section>
          <UsageMeter showDetails={showDetailedMetrics} />
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Text variant="headingMd" as="h3">Quick Actions</Text>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <Button url="/influencers" variant="primary">
                    Manage Influencers
                  </Button>
                  <Button url="/ugc">
                    View UGC Posts
                  </Button>
                  <Button url="/payouts">
                    Process Payouts
                  </Button>
                  <Button url="/settings">
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
                      <Text variant="headingLg" as="p" tone="critical">
                        ${metrics.performance.averageOrderValue.toFixed(2)}
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