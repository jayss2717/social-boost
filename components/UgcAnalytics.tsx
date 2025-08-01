'use client';

import { Card, Text, Badge } from '@shopify/polaris';

interface UgcAnalyticsProps {
  posts: unknown[];
}

export function UgcAnalytics({ posts }: UgcAnalyticsProps) {
  // Type guard for post
  function isPost(obj: unknown): obj is { isApproved?: boolean; isRejected?: boolean; isRewarded?: boolean } {
    return typeof obj === 'object' && obj !== null;
  }

  const totalPosts = posts.length;
  const pendingPosts = posts.filter(post => isPost(post) && !post.isApproved && !post.isRejected);
  const approvedPosts = posts.filter(post => isPost(post) && post.isApproved && !post.isRewarded);
  const rewardedPosts = posts.filter(post => isPost(post) && post.isRewarded);
  const rejectedPosts = posts.filter(post => isPost(post) && post.isRejected);

  const approvalRate = totalPosts > 0 ? ((approvedPosts.length + rewardedPosts.length) / totalPosts) * 100 : 0;
  const rewardRate = totalPosts > 0 ? (rewardedPosts.length / totalPosts) * 100 : 0;
  const rejectionRate = totalPosts > 0 ? (rejectedPosts.length / totalPosts) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Key Metrics */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            UGC Performance Overview
          </Text>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {approvalRate.toFixed(1)}%
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Approval Rate
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {rewardRate.toFixed(1)}%
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Reward Rate
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="critical">
                {rejectionRate.toFixed(1)}%
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Rejection Rate
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {pendingPosts.length}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Pending Posts
              </Text>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text variant="headingLg" as="p" tone="success">
                {rewardedPosts.length}
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Rewarded Posts
              </Text>
            </div>
          </div>
        </div>
      </Card>
      {/* Status Summary */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Text variant="headingMd" as="h3">
            Content Status Summary
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodyMd" as="p">Pending Approval</Text>
              <Badge tone="critical">{`${pendingPosts.length}`}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodyMd" as="p">Approved</Text>
              <Badge tone="success">{`${approvedPosts.length}`}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodyMd" as="p">Rewarded</Text>
              <Badge tone="success">{`${rewardedPosts.length}`}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodyMd" as="p">Rejected</Text>
              <Badge tone="critical">{`${rejectedPosts.length}`}</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}