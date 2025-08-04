'use client';

import { Card, Text, ProgressBar, BlockStack, InlineStack, Badge } from '@shopify/polaris';
import { useSubscription } from '@/hooks/useSubscription';
import { useEffect } from 'react';

interface UsageMeterProps {
  type: 'ugc' | 'influencer';
  showDetails?: boolean;
}

export function UsageMeter({ type, showDetails = true }: UsageMeterProps) {
  const { data: subscription, isLoading } = useSubscription();

  // Debug logging
  useEffect(() => {
    if (subscription) {
      console.log('UsageMeter subscription data:', {
        plan: subscription.subscription?.plan?.name,
        usage: subscription.usage,
        type
      });
    }
  }, [subscription, type]);

  if (isLoading || !subscription?.usage) {
    return (
      <Card>
        <div style={{ padding: '1rem' }}>
          <Text variant="bodyMd" as="p" tone="subdued">
            Loading usage data...
          </Text>
        </div>
      </Card>
    );
  }

  const { usage } = subscription;
  const current = type === 'ugc' ? usage.ugcCount : usage.influencerCount;
  const limit = type === 'ugc' ? usage.ugcLimit : usage.influencerLimit;
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isOverLimit = !isUnlimited && current >= limit;
  const isNearLimit = !isUnlimited && percentage >= 80;

  const getProgressTone = () => {
    if (isOverLimit) return 'critical';
    if (isNearLimit) return 'highlight';
    return 'success';
  };

  const getLimitText = () => {
    if (isUnlimited) return 'Unlimited';
    return `${current} / ${limit}`;
  };

  const getTitle = () => {
    return type === 'ugc' ? 'UGC Posts' : 'Influencers';
  };

  return (
    <Card>
      <div style={{ padding: '1rem' }}>
        <BlockStack gap="300">
          <InlineStack align="space-between">
            <Text variant="bodyMd" fontWeight="semibold" as="h3">
              {getTitle()}
            </Text>
            <InlineStack gap="200">
              {isOverLimit && (
                <Badge tone="critical">Over Limit</Badge>
              )}
              {isNearLimit && !isOverLimit && (
                <Badge tone="warning">Near Limit</Badge>
              )}
              <Text variant="bodySm" tone="subdued" as="span">
                {getLimitText()}
              </Text>
            </InlineStack>
          </InlineStack>

          {!isUnlimited && (
            <ProgressBar
              progress={percentage / 100}
              tone={getProgressTone()}
              size="small"
            />
          )}

          {showDetails && (
            <div>
              <Text variant="bodySm" tone="subdued" as="span">
                {isUnlimited 
                  ? `You have unlimited ${type === 'ugc' ? 'UGC posts' : 'influencers'}`
                  : `${current} ${type === 'ugc' ? 'posts' : 'influencers'} used this month`
                }
              </Text>
            </div>
          )}
        </BlockStack>
      </div>
    </Card>
  );
} 