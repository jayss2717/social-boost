'use client';

import { Modal, Text, Button, BlockStack, List, Badge } from '@shopify/polaris';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  usage?: any;
  plans?: any[];
}

export function PaywallModal({ open, onClose, usage, plans }: PaywallModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async (planName: string) => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        },
        body: JSON.stringify({ plan: planName }),
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

  const planFeatures = {
    Free: [
      'Up to 20 UGC posts',
      'Up to 5 influencers',
      'Basic analytics',
      'Email support',
    ],
    Pro: [
      'Up to 1,000 UGC posts',
      'Unlimited influencers',
      'Advanced analytics',
      'Commission payouts',
      'Priority support',
    ],
    Scale: [
      'Unlimited UGC posts',
      'Unlimited influencers',
      'Advanced analytics',
      'Commission payouts',
      'Priority support',
      'Custom integrations',
    ],
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose Your Plan"
      primaryAction={{
        content: 'Close',
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text variant="bodyMd" tone="subdued" as="p">
            Upgrade your plan to unlock more features and grow your influencer marketing program.
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans?.map((plan) => (
              <div key={plan.name} className="border rounded-lg p-4">
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">
                    {plan.name}
                  </Text>
                  <Text variant="headingLg" as="h2">
                    ${plan.price}/month
                  </Text>
                  
                  <List type="bullet">
                    {planFeatures[plan.name as keyof typeof planFeatures]?.map((feature, index) => (
                      <List.Item key={index}>
                        <Text variant="bodyMd" as="p">{feature}</Text>
                      </List.Item>
                    ))}
                  </List>

                  <Button
                    variant={plan.name !== 'Free' ? 'primary' : 'secondary'}
                    onClick={() => handleUpgrade(plan.name)}
                    loading={isUpgrading}
                    disabled={plan.name === 'Free'}
                    fullWidth
                  >
                    {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </BlockStack>
              </div>
            ))}
          </div>

                      {usage && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Text variant="headingSm" as="h4">
                  Current Usage
                </Text>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <Text variant="bodyMd" as="p">UGC Posts</Text>
                    <Text variant="bodyMd" as="p">
                      {usage.ugcCount} / {usage.ugcLimit === -1 ? '∞' : usage.ugcLimit}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="bodyMd" as="p">Influencers</Text>
                    <Text variant="bodyMd" as="p">
                      {usage.influencerCount} / {usage.influencerLimit === -1 ? '∞' : usage.influencerLimit}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
  );
} 