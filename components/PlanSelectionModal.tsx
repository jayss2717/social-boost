'use client';

import { Modal, Text, BlockStack, Badge, Card } from '@shopify/polaris';
import { useState } from 'react';

interface PlanSelectionModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan?: string;
  onPlanChange: (newPlan: string) => void;
  isLoading?: boolean;
}

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$0',
    priceCents: 0,
    features: [
      'Up to 5 UGC posts per month',
      'Up to 1 active influencer',
      'Basic analytics',
      'Email support',
    ],
    limits: {
      ugcLimit: 5,
      influencerLimit: 1,
    },
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$29.99',
    priceCents: 2999,
    features: [
      'Up to 300 UGC posts per month',
      'Up to 10 active influencers',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
    ],
    limits: {
      ugcLimit: 300,
      influencerLimit: 10,
    },
  },
  {
    id: 'SCALE',
    name: 'Scale',
    price: '$69.99',
    priceCents: 6999,
    features: [
      'Up to 1000 UGC posts per month',
      'Up to 50 active influencers',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Custom integrations',
    ],
    limits: {
      ugcLimit: 1000,
      influencerLimit: 50,
    },
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Custom',
    priceCents: 0,
    features: [
      'Unlimited UGC posts',
      'Unlimited influencers',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding',
      'API access',
    ],
    limits: {
      ugcLimit: -1,
      influencerLimit: -1,
    },
  },
];

export function PlanSelectionModal({ 
  open, 
  onClose, 
  currentPlan, 
  onPlanChange,
  isLoading = false 
}: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      onPlanChange(selectedPlan);
      onClose();
    }
  };

  const getCurrentPlanIndex = () => {
    return PLANS.findIndex(plan => plan.id === currentPlan);
  };

  const getSelectedPlanIndex = () => {
    return PLANS.findIndex(plan => plan.id === selectedPlan);
  };

  const isUpgrade = () => {
    const currentIndex = getCurrentPlanIndex();
    const selectedIndex = getSelectedPlanIndex();
    return selectedIndex > currentIndex;
  };

  const isDowngrade = () => {
    const currentIndex = getCurrentPlanIndex();
    const selectedIndex = getSelectedPlanIndex();
    return selectedIndex < currentIndex;
  };

  const getActionText = () => {
    if (!selectedPlan) return 'Select a plan';
    if (selectedPlan === currentPlan) return 'Current plan';
    if (isUpgrade()) return 'Upgrade';
    if (isDowngrade()) return 'Downgrade';
    return 'Change plan';
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Subscription Plan"
      primaryAction={{
        content: getActionText(),
        onAction: handleConfirm,
        disabled: !selectedPlan || selectedPlan === currentPlan || isLoading,
        loading: isLoading,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text variant="bodyMd" as="p">
            Choose a plan that fits your needs. You can upgrade or downgrade at any time.
          </Text>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {PLANS.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const isSelected = plan.id === selectedPlan;
              
              return (
                <div
                  key={plan.id}
                  style={{
                    border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    cursor: 'pointer',
                    opacity: isCurrentPlan ? 0.7 : 1,
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                  }}
                  onClick={() => !isCurrentPlan && handlePlanSelect(plan.id)}
                >
                  <Card>
                  <div style={{ padding: '1rem' }}>
                    <BlockStack gap="300">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="headingMd" fontWeight="semibold" as="h3">
                          {plan.name}
                        </Text>
                        {isCurrentPlan && (
                          <Badge tone="success">Current</Badge>
                        )}
                      </div>

                      <div>
                        <Text variant="headingLg" fontWeight="bold" as="p">
                          {plan.price}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {plan.priceCents > 0 ? 'per month' : 'Free forever'}
                        </Text>
                      </div>

                      <div>
                        <Text variant="bodySm" fontWeight="semibold" as="p">
                          Limits:
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {plan.limits.ugcLimit === -1 ? '∞' : plan.limits.ugcLimit} UGC posts
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {plan.limits.influencerLimit === -1 ? '∞' : plan.limits.influencerLimit} influencers
                        </Text>
                      </div>

                      <div>
                        <Text variant="bodySm" fontWeight="semibold" as="p">
                          Features:
                        </Text>
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                          {plan.features.map((feature, index) => (
                            <li key={index}>
                              <Text variant="bodySm" tone="subdued" as="p">
                                {feature}
                              </Text>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {isSelected && !isCurrentPlan && (
                        <div style={{ 
                          backgroundColor: '#3B82F6', 
                          color: 'white', 
                          padding: '0.5rem', 
                          borderRadius: '0.25rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                            {isUpgrade() ? 'Upgrade' : 'Downgrade'} to {plan.name}
                          </div>
                        </div>
                      )}
                    </BlockStack>
                  </div>
                </Card>
                  </div>
              );
            })}
          </div>

          {selectedPlan && selectedPlan !== currentPlan && (
            <div style={{ 
              backgroundColor: '#FEF3C7', 
              border: '1px solid #F59E0B', 
              borderRadius: '0.5rem', 
              padding: '1rem' 
            }}>
              <Text variant="bodySm" as="p">
                <strong>Note:</strong> {isUpgrade() 
                  ? 'You will be charged the new plan rate immediately.' 
                  : 'Your plan will be downgraded at the end of your current billing period.'
                }
              </Text>
            </div>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 