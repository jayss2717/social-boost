'use client';

import { Card, Text, Button, BlockStack } from '@shopify/polaris';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';

interface PlanGateProps {
  children: React.ReactNode;
  requiredPlan: 'Starter' | 'Pro' | 'Scale' | 'Enterprise';
  showUpgradeButton?: boolean;
}

const planHierarchy = {
  'Starter': 0,
  'Pro': 1,
  'Scale': 2,
  'Enterprise': 3,
};

export function PlanGate({ 
  children, 
  requiredPlan, 
  showUpgradeButton = true 
}: PlanGateProps) {
  const { data: subscription, isLoading } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <Text variant="bodyMd" tone="subdued" as="p">
            Loading subscription data...
          </Text>
        </div>
      </Card>
    );
  }

  if (!subscription?.subscription) {
    // No subscription - show upgrade prompt
    return (
      <Card>
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Upgrade Required
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              This feature requires a {requiredPlan} plan or higher.
            </Text>
            {showUpgradeButton && (
              <Button 
                variant="primary"
                onClick={async () => {
                  setIsUpgrading(true);
                  try {
                    const merchantId = localStorage.getItem('merchantId');
                    const response = await fetch('/api/subscription/upgrade', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-merchant-id': merchantId || '',
                      },
                      body: JSON.stringify({ plan: requiredPlan }),
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
                }}
                loading={isUpgrading}
              >
                Upgrade to {requiredPlan}
              </Button>
            )}
          </BlockStack>
        </div>
      </Card>
    );
  }

  const currentPlan = subscription.subscription.plan?.name || 'Starter';
  const currentPlanLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];

  if (currentPlanLevel < requiredPlanLevel) {
    // Plan too low - show upgrade prompt
    return (
      <Card>
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Plan Upgrade Required
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              This feature requires a {requiredPlan} plan or higher. 
              You currently have a {currentPlan} plan.
            </Text>
            {showUpgradeButton && (
              <Button 
                variant="primary"
                onClick={async () => {
                  setIsUpgrading(true);
                  try {
                    const merchantId = localStorage.getItem('merchantId');
                    const response = await fetch('/api/subscription/upgrade', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-merchant-id': merchantId || '',
                      },
                      body: JSON.stringify({ plan: requiredPlan }),
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
                }}
                loading={isUpgrading}
              >
                Upgrade to {requiredPlan}
              </Button>
            )}
          </BlockStack>
        </div>
      </Card>
    );
  }

  // Plan sufficient - show children
  return <>{children}</>;
} 