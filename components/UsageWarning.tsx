'use client';

import { Banner } from '@shopify/polaris';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';

interface UsageWarningProps {
  type: 'ugc' | 'influencer';
  threshold?: number; // Percentage threshold for warning (default 80%)
}

export function UsageWarning({ type, threshold = 80 }: UsageWarningProps) {
  const { data: subscription, isLoading } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (isLoading || !subscription?.usage) return null;

  const { usage } = subscription;
  const current = type === 'ugc' ? usage.ugcCount : usage.influencerCount;
  const limit = type === 'ugc' ? usage.ugcLimit : usage.influencerLimit;
  
  // Skip if unlimited
  if (limit === -1) return null;
  
  const percentage = (current / limit) * 100;
  
  // Only show warning if approaching threshold
  if (percentage < threshold) return null;

  const getTitle = () => {
    return type === 'ugc' ? 'UGC Posts' : 'Influencers';
  };

  const getTone = () => {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'info';
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const merchantId = localStorage.getItem('merchantId');
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId || '',
        },
        body: JSON.stringify({ plan: 'PRO' }),
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
      title={`Approaching ${getTitle()} Limit`}
      tone={getTone()}
      action={{
        content: 'Upgrade Plan',
        onAction: handleUpgrade,
        loading: isUpgrading,
      }}
    >
      <p>
        You&apos;ve used {current} of {limit} {getTitle().toLowerCase()}. 
        {percentage >= 95 
          ? ' You\'re very close to your limit!' 
          : ' Consider upgrading to continue growing your influencer marketing program.'
        }
      </p>
    </Banner>
  );
} 