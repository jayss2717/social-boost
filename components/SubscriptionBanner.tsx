'use client';

import { Banner } from '@shopify/polaris';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';

export function SubscriptionBanner() {
  const { data: subscription, isLoading } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (isLoading || !subscription) return null;

  // Add null checks for usage object
  const { usage } = subscription;
  if (!usage) return null;

  const isOverLimit = (usage.ugcCount >= usage.ugcLimit && usage.ugcLimit !== -1) ||
                     (usage.influencerCount >= usage.influencerLimit && usage.influencerLimit !== -1);

  if (!isOverLimit) return null;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: 'Pro' }),
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Banner
      title="You've reached your plan limits"
      tone="warning"
      action={{
        content: 'Upgrade Plan',
        onAction: handleUpgrade,
        loading: isUpgrading,
      }}
    >
      <p>
        You&apos;ve used {usage.ugcCount} of {usage.ugcLimit} UGC posts and {usage.influencerCount} of {usage.influencerLimit} influencers. 
        Upgrade to continue growing your influencer marketing program.
      </p>
    </Banner>
  );
} 