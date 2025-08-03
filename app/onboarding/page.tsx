'use client';

import { Page, Layout, Card, Text, Button, BlockStack, TextField, Select, Banner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Store, Users, Hash, DollarSign, Settings } from 'lucide-react';
import React from 'react';

interface OnboardingData {
  businessType: string;
  industry: string;
  goals: string[];
  commissionRate: number;
  autoApprove: boolean;
  minEngagement: number;
  payoutSchedule: 'WEEKLY' | 'MONTHLY' | 'MANUAL';
  teamSize: string;
  selectedPlan?: string;
  socialMediaConnected?: boolean;
}

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Store Verification',
    description: 'Verify your store details',
    icon: Store,
  },
  {
    id: 2,
    title: 'Business Setup',
    description: 'Configure your business preferences',
    icon: Settings,
  },
  {
    id: 3,
    title: 'Influencer Settings',
    description: 'Set up commission rates and approval workflow',
    icon: Users,
  },
  {
    id: 4,
    title: 'UGC Preferences',
    description: 'Configure content approval and rewards',
    icon: Hash,
  },
  {
    id: 5,
    title: 'Payout Setup',
    description: 'Configure payment schedules',
    icon: DollarSign,
  },
  {
    id: 6,
    title: 'Connect Social Media',
    description: 'Connect your social media accounts',
    icon: Hash,
  },
  {
    id: 7,
    title: 'Choose Plan',
    description: 'Select your subscription plan',
    icon: DollarSign,
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [merchantData, setMerchantData] = useState<{
    shopName?: string;
    shopEmail?: string;
    shopDomain?: string;
    shopCurrency?: string;
    accessToken?: string;
    shopifyShopId?: string;
  } | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessType: 'ECOMMERCE',
    industry: '',
    goals: [],
    commissionRate: 10,
    autoApprove: false,
    minEngagement: 100,
    payoutSchedule: 'WEEKLY',
    teamSize: '1-5',
  });
  const [hasError, setHasError] = useState(false);

  // Error boundary for React errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught in onboarding:', error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in onboarding:', event.reason);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    console.log('Onboarding page loaded');
    fetchMerchantData();
  }, []);

  const fetchMerchantData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      
      if (!shop) return;

      // Try to fetch merchant data with retries (in case of timing issues)
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        const response = await fetch(`/api/merchant?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Found merchant data:', data);
          
          // Check if OAuth has been completed
          if (data.accessToken === 'pending' || !data.shopifyShopId) {
            console.log('OAuth not completed, redirecting to OAuth flow...');
            // Redirect to OAuth flow to complete the installation
            window.location.href = `/api/auth/shopify?shop=${shop}`;
            return;
          }
          
          // Store merchant ID in localStorage if not already set
          if (data.id && !localStorage.getItem('merchantId')) {
            localStorage.setItem('merchantId', data.id);
            console.log('Stored merchant ID in localStorage:', data.id);
          }
          
          setMerchantData(data);
          return; // Success, exit the function
        } else if (response.status === 404) {
          console.log(`Attempt ${attempts + 1}: Merchant not found, retrying...`);
          attempts++;
          if (attempts < maxAttempts) {
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.error('Failed to fetch merchant data:', response.status);
          break;
        }
      }
      
      // If all attempts failed, redirect to OAuth flow
      console.log('Merchant not found after all attempts, redirecting to OAuth flow...');
      window.location.href = `/api/auth/shopify?shop=${shop}`;
    } catch (error) {
      console.error('Error fetching merchant data:', error);
      // Redirect to OAuth flow on error
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      if (shop) {
        window.location.href = `/api/auth/shopify?shop=${shop}`;
      }
    }
  };

  const handleNext = async () => {
    console.log('Moving to next step:', currentStep + 1);
    if (currentStep === ONBOARDING_STEPS.length) {
      await completeOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    console.log('Moving to previous step:', currentStep - 1);
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const completeOnboarding = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      
      if (!shop) {
        console.error('No shop parameter found');
        return;
      }

      console.log('Completing onboarding with data:', onboardingData);

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          onboardingData,
        }),
      });

      if (response.ok) {
        console.log('Onboarding completed successfully');
        // Redirect to dashboard with shop parameter to prevent looping
        window.location.href = `/?shop=${shop}`;
      } else {
        console.error('Failed to complete onboarding:', response.status);
        // Still redirect to prevent getting stuck
        window.location.href = `/?shop=${shop}`;
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Redirect anyway to prevent getting stuck
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      if (shop) {
        window.location.href = `/?shop=${shop}`;
      }
    }
  };

  const updateOnboardingData = (field: keyof OnboardingData, value: unknown) => {
    console.log('Updating onboarding data:', field, value);
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(Store, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    Store Verification
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Let&apos;s verify your store details from Shopify
                  </Text>
                </div>

                {merchantData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextField
                        label="Store Name"
                        value={merchantData.shopName || ''}
                        readOnly
                        autoComplete="off"
                      />
                      <TextField
                        label="Store Email"
                        value={merchantData.shopEmail || ''}
                        readOnly
                        autoComplete="off"
                      />
                      <TextField
                        label="Store Domain"
                        value={merchantData.shopDomain || ''}
                        readOnly
                        autoComplete="off"
                      />
                      <TextField
                        label="Currency"
                        value={merchantData.shopCurrency || ''}
                        readOnly
                        autoComplete="off"
                      />
                    </div>
                    
                    <Banner tone="success">
                      <Text variant="bodyMd" as="p">
                        ✅ Store details verified from Shopify
                      </Text>
                    </Banner>
                  </div>
                )}
              </BlockStack>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(Settings, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    Business Setup
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Tell us about your business
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Business Type"
                    options={[
                      { label: 'E-commerce', value: 'ECOMMERCE' },
                      { label: 'Fashion & Apparel', value: 'FASHION' },
                      { label: 'Beauty & Cosmetics', value: 'BEAUTY' },
                      { label: 'Electronics', value: 'ELECTRONICS' },
                      { label: 'Food & Beverage', value: 'FOOD' },
                      { label: 'Other', value: 'OTHER' },
                    ]}
                    value={onboardingData.businessType}
                    onChange={(value) => updateOnboardingData('businessType', value)}
                  />
                  <TextField
                    label="Industry"
                    value={onboardingData.industry}
                    onChange={(value) => updateOnboardingData('industry', value)}
                    placeholder="e.g. Fashion, Beauty, Electronics"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    What are your main goals?
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {[
                      'Increase brand awareness',
                      'Drive sales',
                      'Build community',
                      'Generate UGC',
                      'Partner with influencers',
                      'Improve social media presence'
                    ].map((goal) => (
                      <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onboardingData.goals.includes(goal)}
                          onChange={(e) => {
                            const newGoals = e.target.checked
                              ? [...onboardingData.goals, goal]
                              : onboardingData.goals.filter(g => g !== goal);
                            updateOnboardingData('goals', newGoals);
                          }}
                          className="rounded"
                        />
                        <Text variant="bodySm" as="span">{goal}</Text>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Team Size"
                    options={[
                      { label: '1-5 people', value: '1-5' },
                      { label: '6-20 people', value: '6-20' },
                      { label: '21-50 people', value: '21-50' },
                      { label: '50+ people', value: '50+' },
                    ]}
                    value={onboardingData.teamSize}
                    onChange={(value) => updateOnboardingData('teamSize', value)}
                  />
                </div>
              </BlockStack>
            </div>
          </Card>
        );

      case 3:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(Users, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    Influencer Settings
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Configure how you work with influencers
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Default Commission Rate (%)"
                    type="number"
                    value={onboardingData.commissionRate.toString()}
                    onChange={(value) => updateOnboardingData('commissionRate', parseFloat(value) || 0)}
                    suffix="%"
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoApprove"
                    className="rounded"
                    checked={onboardingData.autoApprove}
                    onChange={(e) => updateOnboardingData('autoApprove', e.target.checked)}
                  />
                  <label htmlFor="autoApprove">
                    <Text variant="bodySm" as="span">
                      Auto-approve influencer applications
                    </Text>
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Commission rates:</strong> This is the percentage you&apos;ll pay influencers for successful sales they drive to your store.
                  </Text>
                </div>
              </BlockStack>
            </div>
          </Card>
        );

      case 4:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(Hash, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    UGC Preferences
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Configure content approval and rewards
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Minimum Engagement Required"
                    type="number"
                    value={onboardingData.minEngagement.toString()}
                    onChange={(value) => updateOnboardingData('minEngagement', parseInt(value) || 0)}
                    suffix="followers"
                    autoComplete="off"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Engagement threshold:</strong> Only posts with this many followers or more will be eligible for automatic discount codes.
                  </Text>
                </div>
              </BlockStack>
            </div>
          </Card>
        );

      case 5:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(DollarSign, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    Payout Setup
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Configure payment schedules
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Payout Schedule"
                    options={[
                      { label: 'Weekly', value: 'WEEKLY' },
                      { label: 'Monthly', value: 'MONTHLY' },
                      { label: 'Manual', value: 'MANUAL' },
                    ]}
                    value={onboardingData.payoutSchedule}
                    onChange={(value) => updateOnboardingData('payoutSchedule', value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Payout schedule:</strong> How often you&apos;d like to process commission payments to your influencers.
                  </Text>
                </div>
              </BlockStack>
            </div>
          </Card>
        );

      case 6:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(Hash, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    Connect Social Media
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Connect your social media accounts to detect brand mentions
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instagram */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            IG
                          </span>
                        </div>
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          Instagram
                        </Text>
                      </div>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Detect brand mentions and send discount codes via DM
                    </Text>
                    <div className="mt-3">
                      <Button 
                        size="slim" 
                        onClick={() => {
                          const merchantId = localStorage.getItem('merchantId');
                          if (merchantId) {
                            window.location.href = `/api/auth/instagram?merchantId=${merchantId}`;
                          } else {
                            updateOnboardingData('socialMediaConnected', true);
                          }
                        }}
                      >
                        Connect Instagram
                      </Button>
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            TT
                          </span>
                        </div>
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          TikTok
                        </Text>
                      </div>
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Monitor TikTok mentions and engage with creators
                    </Text>
                    <div className="mt-3">
                      <Button 
                        size="slim" 
                        onClick={() => {
                          const merchantId = localStorage.getItem('merchantId');
                          if (merchantId) {
                            window.location.href = `/api/auth/tiktok?merchantId=${merchantId}`;
                          } else {
                            updateOnboardingData('socialMediaConnected', true);
                          }
                        }}
                      >
                        Connect TikTok
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>How it works:</strong> Once connected, we&apos;ll automatically detect when someone mentions your brand and send them a discount code via direct message.
                  </Text>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skipSocialMedia"
                    className="rounded"
                    onChange={(e) => updateOnboardingData('socialMediaConnected', e.target.checked)}
                  />
                  <label htmlFor="skipSocialMedia">
                    <Text variant="bodySm" as="span">
                      Skip for now (I&apos;ll connect later)
                    </Text>
                  </label>
                </div>
              </BlockStack>
            </div>
          </Card>
        );

      case 7:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  {React.createElement(DollarSign, { className: "w-12 h-12 mx-auto mb-4 text-blue-600" })}
                  <Text variant="headingLg" as="h2">
                    Choose Your Plan
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Select the perfect plan for your business
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Starter Plan */}
                  <div className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="text-center">
                      <Text variant="headingMd" as="h3" fontWeight="bold">
                        Starter
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                        Free
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Perfect for getting started
                      </Text>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">1 Influencer</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">5 DMs/month</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Basic UGC detection</Text>
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors bg-blue-50 border-blue-200">
                    <div className="text-center">
                      <Text variant="headingMd" as="h3" fontWeight="bold">
                        Pro
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                        $19.99
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Most popular choice
                      </Text>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">10 Influencers</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">300 DMs/month</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Advanced analytics</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Priority support</Text>
                      </div>
                    </div>
                  </div>

                  {/* Scale Plan */}
                  <div className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="text-center">
                      <Text variant="headingMd" as="h3" fontWeight="bold">
                        Scale
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                        $59.99
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        For growing businesses
                      </Text>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">50 Influencers</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">1000 DMs/month</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Advanced analytics</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Priority support</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Custom integrations</Text>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="text-center">
                      <Text variant="headingMd" as="h3" fontWeight="bold">
                        Enterprise
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                        Custom
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        For large teams
                      </Text>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Unlimited Influencers</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Unlimited DMs</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Custom analytics</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">Dedicated support</Text>
                      </div>
                      <div className="flex items-center">
                        {React.createElement(Check, { className: "w-4 h-4 text-green-600 mr-2" })}
                        <Text variant="bodySm" as="span">White-label options</Text>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skipPlan"
                    className="rounded"
                    onChange={(e) => updateOnboardingData('selectedPlan', e.target.checked ? 'Starter' : undefined)}
                  />
                  <label htmlFor="skipPlan">
                    <Text variant="bodySm" as="span">
                      Start with free plan (I&apos;ll upgrade later)
                    </Text>
                  </label>
                </div>
              </BlockStack>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  // Handle React errors gracefully
  if (hasError) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Application Error
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Something went wrong with the onboarding. Please refresh the page to try again.
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                  </div>
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Text variant="headingMd" as="h1">
                  Setup Your Store
                </Text>
                <Text variant="bodySm" tone="subdued" as="span">
                  Step {currentStep} of {ONBOARDING_STEPS.length}
                </Text>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-2">
                {ONBOARDING_STEPS.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        isActive ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          React.createElement(Check, { className: "w-4 h-4" })
                        ) : (
                          React.createElement(StepIcon, { className: "w-4 h-4" })
                        )}
                      </div>
                      <span className={`text-center text-sm ${
                        isActive ? 'font-semibold' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <Button onClick={handleBack} icon={() => React.createElement(ArrowLeft, {})}>
                    Back
                  </Button>
                )}
              </div>
              
              <div>
                <Button 
                  variant="primary"
                  onClick={handleNext}
                  icon={currentStep === ONBOARDING_STEPS.length ? undefined : () => React.createElement(ArrowRight, {})}
                >
                  {currentStep === ONBOARDING_STEPS.length ? 'Complete Setup' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}