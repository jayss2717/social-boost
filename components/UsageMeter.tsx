'use client';

import { ProgressBar, Text, BlockStack } from '@shopify/polaris';

interface UsageMeterProps {
  current: number;
  limit: number;
  label: string;
  type: 'ugc' | 'influencer';
}

export function UsageMeter({ current, limit, label, type }: UsageMeterProps) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isOverLimit = limit !== -1 && current >= limit;

  return (
    <BlockStack gap="200">
      <div className="flex justify-between items-center">
        <Text variant="bodyMd" as="p">{label}</Text>
        <Text variant="bodyMd" tone="subdued" as="p">
          {current} / {limit === -1 ? '∞' : limit}
        </Text>
      </div>
      <ProgressBar
        progress={percentage / 100}
        size="small"
      />
      {isOverLimit && (
        <Text variant="bodySm" tone="critical" as="p">
          Limit reached. Upgrade your plan to continue.
        </Text>
      )}
    </BlockStack>
  );
} 