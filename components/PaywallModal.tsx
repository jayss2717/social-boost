'use client';

import { Modal, Text, Button, BlockStack, InlineStack, Badge, Divider } from '@shopify/polaris';
import { useState } from 'react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  usage: {
    ugcCount: number;
    influencerCount: number;
    ugcLimit: number;
    influencerLimit: number;
  };
}

interface Plan {
  id: string;
  name: string;
  priceCents: number;
  ugcLimit: number;
  influencerLimit: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceCents: 2900,
    ugcLimit: 20,
    influencerLimit: 5,
    features: [
      'Up to 20 UGC posts per month',
      'Up to 5 active influencers',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Pro',
    priceCents: 2999,
    ugcLimit: 100,
    influencerLimit: 20,
    features: [
      'Up to 100 UGC posts per month',
      'Up to 20 active influencers',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    priceCents: 6999,
    ugcLimit: 500,
    influencerLimit: 50,
    features: [
      'Up to 500 UGC posts per month',
      'Up to 50 active influencers',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Custom integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceCents: 19900,
    ugcLimit: -1,
    influencerLimit: -1,
    features: [
      'Unlimited UGC posts',
      'Unlimited influencers',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding',
      'API access',
    ],
  },
];

export default function PaywallModal({ open, onClose, onSubscribe, usage }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const selectedPlanData = PLANS.find(plan => plan.id === selectedPlan);

  const getPrice = (plan: Plan) => {
    const basePrice = plan.priceCents / 100;
    if (billingCycle === 'yearly') {
      return basePrice * 12 * 0.8; // 20% discount for yearly
    }
    return basePrice;
  };

  const handleSubscribe = () => {
    onSubscribe(selectedPlan, billingCycle);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade Your Plan"
      primaryAction={{
        content: 'Subscribe',
        onAction: handleSubscribe,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
      size="large"
    >
      <Modal.Section>
        <BlockStack gap="400">
          <div className="text-center">
            <Text variant="headingLg" as="h2">
              Choose Your Plan
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              Upgrade to unlock more features and grow your influencer marketing program
            </Text>
          </div>

          {/* Current Usage */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text variant="headingMd" as="h3">
              Current Usage
            </Text>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Text variant="bodyMd" as="p">
                  UGC Posts: {usage.ugcCount}/{usage.ugcLimit === -1 ? '∞' : usage.ugcLimit}
                </Text>
              </div>
              <div>
                <Text variant="bodyMd" as="p">
                  Influencers: {usage.influencerCount}/{usage.influencerLimit === -1 ? '∞' : usage.influencerLimit}
                </Text>
              </div>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="text-center">
            <InlineStack gap="200" align="center">
              <Button
                variant={billingCycle === 'monthly' ? 'primary' : 'secondary'}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={billingCycle === 'yearly' ? 'primary' : 'secondary'}
                  onClick={() => setBillingCycle('yearly')}
                >
                  Yearly
                </Button>
                <Badge tone="success">Save 20%</Badge>
              </div>
            </InlineStack>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="text-center">
                  <Text variant="headingMd" as="h3">
                    {plan.name}
                  </Text>
                  <Text variant="headingLg" as="p" fontWeight="bold">
                    ${getPrice(plan).toFixed(0)}/{billingCycle === 'monthly' ? 'mo' : 'mo (billed yearly)'}
                  </Text>
                  {plan.ugcLimit === -1 ? (
                    <Text variant="bodySm" tone="subdued" as="p">
                      Unlimited UGC posts
                    </Text>
                  ) : (
                    <Text variant="bodySm" tone="subdued" as="p">
                      Up to {plan.ugcLimit} UGC posts
                    </Text>
                  )}
                  {plan.influencerLimit === -1 ? (
                    <Text variant="bodySm" tone="subdued" as="p">
                      Unlimited influencers
                    </Text>
                  ) : (
                    <Text variant="bodySm" tone="subdued" as="p">
                      Up to {plan.influencerLimit} influencers
                    </Text>
                  )}
                </div>

                <Divider />

                <BlockStack gap="200">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Text variant="bodySm" as="span">
                        {feature}
                      </Text>
                    </div>
                  ))}
                </BlockStack>
              </div>
            ))}
          </div>

          {selectedPlanData && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <Text variant="headingMd" as="h3">
                Selected Plan: {selectedPlanData.name}
              </Text>
              <Text variant="bodyMd" as="p">
                ${getPrice(selectedPlanData).toFixed(0)}/{billingCycle === 'monthly' ? 'month' : 'month (billed yearly)'}
              </Text>
            </div>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 