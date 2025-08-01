'use client';

import { Card, ProgressBar, Text, Badge, Button } from '@shopify/polaris';
import { useMetrics } from '@/hooks/useMetrics';
import { useState } from 'react';

interface UsageMeterProps {
  showDetails?: boolean;
}

export function UsageMeter({ showDetails = false }: UsageMeterProps) {
  const { data: metrics, isLoading, error } = useMetrics();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  if (isLoading) {
    return (
      <Card>
        <div style={{ padding: '1rem' }}>
          <Text variant="bodyMd" as="p">Loading usage metrics...</Text>
        </div>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <div style={{ padding: '1rem' }}>
          <Text variant="bodyMd" as="p" tone="critical">
            Failed to load usage metrics
          </Text>
        </div>
      </Card>
    );
  }

  const { summary, performance } = metrics;

  // Calculate usage percentages
  const ugcUsagePercent = summary.ugcLimit > 0 ? (summary.ugcCount / summary.ugcLimit) * 100 : 0;
  const influencerUsagePercent = summary.influencerLimit > 0 ? (summary.influencerCount / summary.influencerLimit) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Card>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="headingMd" as="h3">Usage Overview</Text>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {['7d', '30d', '90d', '1y'].map((period) => (
                  <Button
                    key={period}
                    size="slim"
                    pressed={selectedPeriod === period}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Text variant="bodyMd" as="p">
                    UGC Posts: {summary.ugcCount} / {summary.ugcLimit === -1 ? '∞' : summary.ugcLimit}
                  </Text>
                  <ProgressBar
                    progress={Math.min(ugcUsagePercent, 100)}
                    size="small"
                    tone={ugcUsagePercent > 80 ? 'critical' : 'success'}
                  />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Text variant="bodyMd" as="p">
                    Influencers: {summary.influencerCount} / {summary.influencerLimit === -1 ? '∞' : summary.influencerLimit}
                  </Text>
                  <ProgressBar
                    progress={Math.min(influencerUsagePercent, 100)}
                    size="small"
                    tone={influencerUsagePercent > 80 ? 'critical' : 'success'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {showDetails && (
        <>
          <Card>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Text variant="headingMd" as="h3">Performance Metrics</Text>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">Total Revenue</Text>
                    <Text variant="headingLg" as="p">
                      ${(summary.totalRevenue / 100).toFixed(2)}
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">Conversion Rate</Text>
                    <Text variant="headingLg" as="p">
                      {(performance.conversionRate * 100).toFixed(1)}%
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">Avg Order Value</Text>
                    <Text variant="headingLg" as="p">
                      ${performance.averageOrderValue.toFixed(2)}
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">Active Discount Codes</Text>
                    <Text variant="headingLg" as="p">
                      {summary.activeDiscountCodes}
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">Total Usage</Text>
                    <Text variant="headingLg" as="p">
                      {summary.totalUsage}
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p" tone="subdued">Total Payouts</Text>
                    <Text variant="headingLg" as="p">
                      ${(summary.totalPayoutAmount / 100).toFixed(2)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {metrics.topPerformingCodes && metrics.topPerformingCodes.length > 0 && (
            <Card>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Text variant="headingMd" as="h3">Top Performing Codes</Text>
                  
                  {metrics.topPerformingCodes.map((code) => (
                    <div key={code.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text variant="bodyMd" as="p">
                          {code.code}
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          {code.influencerName}
                        </Text>
                      </div>
                      
                      <div>
                        <Badge tone="success">
                          {`${code.usageCount} uses`}
                        </Badge>
                      </div>
                      
                      <div>
                        <Text variant="bodyMd" as="p">
                          {code.discountValue}{code.discountType === 'PERCENTAGE' ? '%' : '$'} off
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 