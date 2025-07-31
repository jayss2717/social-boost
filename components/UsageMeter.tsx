'use client';

import { Card, Text, ProgressBar, Button, Badge } from '@shopify/polaris';
import { AlertTriangle, Users, MessageCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import PaywallModal from './PaywallModal';

interface UsageMeterProps {
  merchantId: string;
  onUpgrade?: () => void;
}

interface UsageData {
  influencers: number;
  dmsSent: number;
  limit: {
    influencers: number;
    dmsPerMonth: number;
  };
}

export default function UsageMeter({ merchantId, onUpgrade }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription', {
        headers: {
          'x-merchant-id': merchantId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleUpgrade = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // Handle subscription upgrade
    console.log('Upgrading to:', planId, billingCycle);
    setShowPaywall(false);
    if (onUpgrade) {
      onUpgrade();
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const influencerPercentage = (usage.influencers / usage.limit.influencers) * 100;
  const dmPercentage = (usage.dmsSent / usage.limit.dmsPerMonth) * 100;
  const isAtLimit = influencerPercentage >= 100 || dmPercentage >= 100;

  return (
    <>
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Text variant="headingMd" as="h3">
              Usage This Month
            </Text>
            {isAtLimit && (
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
                <Badge tone="critical">At Limit</Badge>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Influencers Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <Text variant="bodyMd" as="span">
                    Influencers
                  </Text>
                </div>
                <Text variant="bodyMd" as="span">
                  {usage.influencers} / {usage.limit.influencers === -1 ? '∞' : usage.limit.influencers}
                </Text>
              </div>
              <ProgressBar
                progress={Math.min(influencerPercentage, 100)}
                tone={influencerPercentage >= 90 ? 'critical' : 'success'}
                size="small"
              />
            </div>

            {/* DMs Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <Text variant="bodyMd" as="span">
                    DMs Sent
                  </Text>
                </div>
                <Text variant="bodyMd" as="span">
                  {usage.dmsSent} / {usage.limit.dmsPerMonth === -1 ? '∞' : usage.limit.dmsPerMonth}
                </Text>
              </div>
              <ProgressBar
                progress={Math.min(dmPercentage, 100)}
                tone={dmPercentage >= 90 ? 'critical' : 'success'}
                size="small"
              />
            </div>
          </div>

          {isAtLimit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text variant="bodySm" as="p" tone="critical">
                You&apos;ve reached your current plan limits. Upgrade to continue adding influencers and sending discount codes.
              </Text>
              <div className="mt-2">
                <Button
                  size="slim"
                  onClick={() => setShowPaywall(true)}
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}

          {!isAtLimit && (influencerPercentage >= 80 || dmPercentage >= 80) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Text variant="bodySm" as="p" tone="subdued">
                You&apos;re approaching your plan limits. Consider upgrading for more capacity.
              </Text>
              <div className="mt-2">
                <Button
                  size="slim"
                  variant="secondary"
                  onClick={() => setShowPaywall(true)}
                >
                  View Plans
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleUpgrade}
        usage={usage}
      />
    </>
  );
} 