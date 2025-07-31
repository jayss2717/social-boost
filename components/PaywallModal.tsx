'use client';

import { Modal, Text, BlockStack, Card, Badge } from '@shopify/polaris';
import { Check, X, Star } from 'lucide-react';
import { useState } from 'react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  currentPlan?: string;
  usage?: {
    influencers: number;
    dmsSent: number;
    limit: {
      influencers: number;
      dmsPerMonth: number;
    };
  };
}

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 0,
    priceYearly: 0,
    influencerLimit: 1,
    dmLimit: 5,
    features: [
      '1 Influencer',
      '5 DMs per month',
      'Basic UGC detection',
      'Email support'
    ]
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 19.99,
    priceYearly: 191.90, // 20% off
    influencerLimit: 10,
    dmLimit: 300,
    features: [
      '10 Influencers',
      '300 DMs per month',
      'Advanced analytics',
      'Priority support',
      'Custom discount codes'
    ]
  },
  {
    id: 'SCALE',
    name: 'Scale',
    price: 59.99,
    priceYearly: 575.90, // 20% off
    influencerLimit: 50,
    dmLimit: 1000,
    features: [
      '50 Influencers',
      '1000 DMs per month',
      'Custom integrations',
      'Dedicated support',
      'Advanced reporting'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: null,
    priceYearly: null,
    influencerLimit: -1, // unlimited
    dmLimit: -1, // unlimited
    features: [
      'Unlimited Influencers',
      'Unlimited DMs',
      'Custom features',
      '24/7 support',
      'White-label options'
    ]
  }
];

export default function PaywallModal({ open, onClose, onSubscribe, usage }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getPlan = (planId: string) => plans.find(p => p.id === planId);
  const selectedPlanData = getPlan(selectedPlan);

  const isAtLimit = usage && (
    usage.influencers >= usage.limit.influencers ||
    usage.dmsSent >= usage.limit.dmsPerMonth
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade Your Plan"
      primaryAction={{
        content: selectedPlanData?.id === 'ENTERPRISE' ? 'Contact Support' : 'Subscribe Now',
        onAction: () => {
          if (selectedPlanData?.id === 'ENTERPRISE') {
            window.open('mailto:support@socialboost.app?subject=Enterprise%20Plan%20Inquiry', '_blank');
          } else {
            onSubscribe(selectedPlan, billingCycle);
          }
        }
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose
        }
      ]}
      size="large"
    >
      <Modal.Section>
        <BlockStack gap="400">
          {/* Current Usage Warning */}
          {isAtLimit && (
            <Card>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <X className="w-5 h-5 text-red-600" />
                  <Text variant="bodyMd" fontWeight="semibold" as="p" tone="critical">
                    You&apos;ve reached your current plan limits
                  </Text>
                </div>
                <Text variant="bodySm" as="p" tone="subdued">
                  Upgrade to continue adding influencers and sending discount codes
                </Text>
              </div>
            </Card>
          )}

          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <Card>
                <div className="p-4">
                  <div className="text-center mb-4">
                    {plan.id === 'PRO' && (
                      <div className="mb-2">
                        <Badge tone="success">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <Text variant="headingMd" as="h3" fontWeight="bold">
                      {plan.name}
                    </Text>
                    {plan.price === 0 ? (
                      <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                        Free
                      </Text>
                    ) : plan.price === null ? (
                      <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                        Custom
                      </Text>
                    ) : (
                      <div>
                        <Text variant="headingLg" as="p" fontWeight="bold">
                          ${billingCycle === 'yearly' ? plan.priceYearly : plan.price}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </Text>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">{feature}</Text>
                      </div>
                    ))}
                  </div>

                  {plan.id === 'ENTERPRISE' && (
                    <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Contact our sales team for custom pricing
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
                </div>
              ))}
          </div>

          {/* Billing Cycle Selection */}
          {selectedPlan !== 'STARTER' && selectedPlan !== 'ENTERPRISE' && (
            <Card>
              <div className="p-4">
                <div className="mb-3">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Billing Cycle
                  </Text>
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billingCycle"
                      value="monthly"
                      checked={billingCycle === 'monthly'}
                      onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
                      className="text-blue-600"
                    />
                    <Text variant="bodySm" as="span">Monthly</Text>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billingCycle"
                      value="yearly"
                      checked={billingCycle === 'yearly'}
                      onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
                      className="text-blue-600"
                    />
                    <div className="flex items-center space-x-1">
                      <Text variant="bodySm" as="span">Yearly</Text>
                      <Badge tone="success">Save 20%</Badge>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Special Offer */}
          {selectedPlan !== 'STARTER' && selectedPlan !== 'ENTERPRISE' && (
            <Card>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Special Offer
                  </Text>
                </div>
                <Text variant="bodySm" as="p">
                  Get 20% off when you pay for a full year! 🎉
                </Text>
              </div>
            </Card>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 