'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Banner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { useSubscription } from '@/hooks/useSubscription';
import { useInfluencers } from '@/hooks/useSubscription';
import { useUgcPosts } from '@/hooks/useSubscription';
import { usePayouts } from '@/hooks/useSubscription';

export default function TestPage() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useMetrics();
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const { data: influencers, isLoading: influencersLoading, error: influencersError } = useInfluencers();
  const { data: ugcPosts, isLoading: ugcPostsLoading, error: ugcPostsError } = useUgcPosts();
  const { data: payouts, isLoading: payoutsLoading, error: payoutsError } = usePayouts();

  const [testResults, setTestResults] = useState<Record<string, unknown>>({});

  const runApiTests = async () => {
    const results: Record<string, unknown> = {};

    // Test metrics API
    try {
      const metricsResponse = await fetch('/api/metrics');
      results.metrics = {
        status: metricsResponse.status,
        ok: metricsResponse.ok,
        data: await metricsResponse.json(),
      };
    } catch (error: unknown) {
      results.metrics = { error: (error as Error).message };
    }

    // Test subscription API
    try {
      const subscriptionResponse = await fetch('/api/subscription', {
        headers: {
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        }
      });
      results.subscription = {
        status: subscriptionResponse.status,
        ok: subscriptionResponse.ok,
        data: await subscriptionResponse.json(),
      };
    } catch (error: unknown) {
      results.subscription = { error: (error as Error).message };
    }

    // Test influencers API
    try {
      const influencersResponse = await fetch('/api/influencers');
      results.influencers = {
        status: influencersResponse.status,
        ok: influencersResponse.ok,
        data: await influencersResponse.json(),
      };
    } catch (error: unknown) {
      results.influencers = { error: (error as Error).message };
    }

    // Test UGC posts API
    try {
      const ugcResponse = await fetch('/api/ugc-posts');
      results.ugcPosts = {
        status: ugcResponse.status,
        ok: ugcResponse.ok,
        data: await ugcResponse.json(),
      };
    } catch (error: unknown) {
      results.ugcPosts = { error: (error as Error).message };
    }

    // Test payouts API
    try {
      const payoutsResponse = await fetch('/api/payouts', {
        headers: {
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        }
      });
      results.payouts = {
        status: payoutsResponse.status,
        ok: payoutsResponse.ok,
        data: await payoutsResponse.json(),
      };
    } catch (error: unknown) {
      results.payouts = { error: (error as Error).message };
    }

    setTestResults(results);
  };

  useEffect(() => {
    runApiTests();
  }, []);

  const isLoading = metricsLoading || subscriptionLoading || influencersLoading || ugcPostsLoading || payoutsLoading;

  if (isLoading) {
    return (
      <Page title="Backend Integration Test">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Text variant="headingLg" as="h2">Loading test data...</Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Backend Integration Test">
      <Layout>
        <Layout.Section>
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Backend Integration Test Results</Text>
                
                <Button onClick={runApiTests}>
                  Re-run Tests
                </Button>

                <div className="space-y-4">
                  {/* Metrics Test */}
                  <div>
                    <Text variant="headingMd" as="h3">Metrics API</Text>
                    {metricsError ? (
                      <Banner tone="critical">
                        Error: {metricsError.message}
                      </Banner>
                    ) : (
                      <div className="mt-2">
                        <Text variant="bodyMd" as="span">
                          Total UGC Posts: {metrics?.totalUgcPosts || 0}
                        </Text>
                        <Text variant="bodyMd" as="span">
                          Total Influencers: {metrics?.totalInfluencers || 0}
                        </Text>
                        <Text variant="bodyMd" as="span">
                          Total Revenue: ${(metrics?.totalRevenue || 0) / 100}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Subscription Test */}
                  <div>
                    <Text variant="headingMd" as="h3">Subscription API</Text>
                    {subscriptionError ? (
                      <Banner tone="critical">
                        Error: {subscriptionError.message}
                      </Banner>
                    ) : (
                      <div className="mt-2">
                        <Text variant="bodyMd" as="span">
                          Plan: {subscription?.subscription?.plan?.name || 'Unknown'}
                        </Text>
                        <Text variant="bodyMd" as="span">
                          UGC Count: {subscription?.usage?.ugcCount || 0} / {subscription?.usage?.ugcLimit || 0}
                        </Text>
                        <Text variant="bodyMd" as="span">
                          Influencer Count: {subscription?.usage?.influencerCount || 0} / {subscription?.usage?.influencerLimit || 0}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Influencers Test */}
                  <div>
                    <Text variant="headingMd" as="h3">Influencers API</Text>
                    {influencersError ? (
                      <Banner tone="critical">
                        Error: {influencersError.message}
                      </Banner>
                    ) : (
                      <div className="mt-2">
                        <Text variant="bodyMd" as="span">
                          Count: {influencers?.length || 0}
                        </Text>
                        {influencers?.slice(0, 3).map((influencer: Record<string, unknown>, index: number) => (
                          <Text key={index} variant="bodyMd" as="span">
                            {String(influencer.name)} - {String(influencer.email)}
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* UGC Posts Test */}
                  <div>
                    <Text variant="headingMd" as="h3">UGC Posts API</Text>
                    {ugcPostsError ? (
                      <Banner tone="critical">
                        Error: {ugcPostsError.message}
                      </Banner>
                    ) : (
                      <div className="mt-2">
                        <Text variant="bodyMd" as="span">
                          Count: {ugcPosts?.length || 0}
                        </Text>
                        {ugcPosts?.slice(0, 3).map((post: Record<string, unknown>, index: number) => (
                          <Text key={index} variant="bodyMd" as="span">
                            {String(post.platform)} - {String(post.engagement)} engagement
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payouts Test */}
                  <div>
                    <Text variant="headingMd" as="h3">Payouts API</Text>
                    {payoutsError ? (
                      <Banner tone="critical">
                        Error: {payoutsError.message}
                      </Banner>
                    ) : (
                      <div className="mt-2">
                        <Text variant="bodyMd" as="span">
                          Count: {payouts?.length || 0}
                        </Text>
                        {payouts?.slice(0, 3).map((payout: Record<string, unknown>, index: number) => (
                          <Text key={index} variant="bodyMd" as="span">
                            ${Number(payout.amount || 0) / 100} - {String(payout.status)}
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw API Test Results */}
                <div>
                  <Text variant="headingMd" as="h3">Raw API Test Results</Text>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 