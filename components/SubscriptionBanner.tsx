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

  // Check for canceled subscription
  if (subscription.subscription?.status === 'CANCELED') {
    const endDate = new Date(subscription.subscription.currentPeriodEnd);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Banner
        title="Subscription Canceled"
        tone="warning"
        action={{
          content: 'Reactivate Plan',
          onAction: async () => {
            setIsUpgrading(true);
            try {
              const merchantId = localStorage.getItem('merchantId');
              if (!merchantId) {
                console.error('No merchant ID found');
                return;
              }

              const response = await fetch('/api/subscription/reactivate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ merchantId }),
              });
              
              if (response.ok) {
                // Refresh the page to show updated status
                window.location.reload();
              } else {
                console.error('Failed to reactivate subscription');
              }
            } catch (error) {
              console.error('Failed to reactivate:', error);
            } finally {
              setIsUpgrading(false);
            }
          },
          loading: isUpgrading,
        }}
      >
        <p>
          Your subscription has been canceled. You have access to premium features until {endDate.toLocaleDateString()} ({daysLeft} days left). 
          Reactivate your plan to continue using premium features.
        </p>
      </Banner>
    );
  }

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