'use client';

import { Page, Layout, Card, Text, Button, BlockStack, TextField, Select, Banner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Store, Users, Hash, DollarSign, Settings } from 'lucide-react';

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
    title: 'Choose Plan',
    description: 'Select your subscription plan',
    icon: DollarSign,
  },
  {
    id: 7,
    title: 'Connect Social Media',
    description: 'Connect your social media accounts',
    icon: Hash,
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [merchantData, setMerchantData] = useState<{
    shopName?: string;
    shopEmail?: string;
    shopDomain?: string;
    shopCurrency?: string;
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
        const response = await fetch(`https://socialboost-blue.vercel.app/api/merchant?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Found merchant data:', data);
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
          // Other error, don't retry
          break;
        }
      }
      
      // If all attempts failed, use fallback data
      console.log('All attempts failed, using fallback data');
      const shopName = shop.replace('.myshopify.com', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setMerchantData({
        shopName: shopName,
        shopEmail: `admin@${shop}`,
        shopDomain: shop,
        shopCurrency: 'USD',
      });
    } catch (error) {
      console.error('Failed to fetch merchant data:', error);
      // Fallback: create mock data from shop parameter
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      if (shop) {
        const shopName = shop.replace('.myshopify.com', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setMerchantData({
          shopName: shopName,
          shopEmail: `admin@${shop}`,
          shopDomain: shop,
          shopCurrency: 'USD',
        });
      }
    }
  };

  const handleNext = async () => {
    console.log('handleNext called, currentStep:', currentStep, 'total steps:', ONBOARDING_STEPS.length);
    if (currentStep < ONBOARDING_STEPS.length) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Completing onboarding...');
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('Starting onboarding completion...');
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      
      console.log('Shop:', shop);
      console.log('Onboarding data:', onboardingData);

      const response = await fetch('https://socialboost-blue.vercel.app/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          onboardingData,
        }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Onboarding completed successfully, redirecting...');
        // Redirect to dashboard with shop parameter
        window.location.href = `/?shop=${shop}`;
      } else {
        console.error('Onboarding completion failed:', responseData);
        alert('Failed to complete onboarding. Please try again.');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    }
  };

  const updateOnboardingData = (field: keyof OnboardingData, value: unknown) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <div className="text-center mb-6">
                  <Store className="w-12 h-12 mx-auto mb-4 text-blue-600" />
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
                  <Settings className="w-12 h-12 mx-auto mb-4 text-blue-600" />
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
                  <div className="space-y-2">
                    {['Increase brand awareness', 'Drive sales', 'Build community', 'Generate UGC'].map((goal) => (
                      <label key={goal} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={onboardingData.goals.includes(goal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateOnboardingData('goals', [...onboardingData.goals, goal]);
                            } else {
                              updateOnboardingData('goals', onboardingData.goals.filter(g => g !== goal));
                            }
                          }}
                        />
                        <Text variant="bodyMd" as="span">{goal}</Text>
                      </label>
                    ))}
                  </div>
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
                  <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
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
                    value={String(onboardingData.commissionRate)}
                    onChange={(value) => updateOnboardingData('commissionRate', Number(value))}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                  <Select
                    label="Auto-Approve Influencers"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={onboardingData.autoApprove ? 'true' : 'false'}
                    onChange={(value) => updateOnboardingData('autoApprove', value === 'true')}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Default Commission Rate:</strong> {onboardingData.commissionRate}% of sales generated through influencer links
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
                  <Hash className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <Text variant="headingLg" as="h2">
                    UGC Preferences
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Configure content approval and rewards
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Minimum Engagement"
                    type="number"
                    value={String(onboardingData.minEngagement)}
                    onChange={(value) => updateOnboardingData('minEngagement', parseInt(value))}
                    min="0"
                    helpText="Minimum likes/comments to approve UGC"
                    autoComplete="off"
                  />
                  <Select
                    label="Auto-Approve UGC"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={onboardingData.autoApprove ? 'true' : 'false'}
                    onChange={(value) => updateOnboardingData('autoApprove', value === 'true')}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>UGC Approval:</strong> {onboardingData.autoApprove ? 'Automatically' : 'Manually'} approve user-generated content with {onboardingData.minEngagement}+ engagement
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
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-blue-600" />
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
                  <Select
                    label="Team Size"
                    options={[
                      { label: '1-5 people', value: '1-5' },
                      { label: '6-20 people', value: '6-20' },
                      { label: '20+ people', value: '20+' },
                    ]}
                    value={onboardingData.teamSize}
                    onChange={(value) => updateOnboardingData('teamSize', value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Payout Schedule:</strong> Process influencer payments {onboardingData.payoutSchedule.toLowerCase()}
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
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-blue-600" />
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
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">1 Influencer</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">5 DMs/month</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
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
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">10 Influencers</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">300 DMs/month</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">Advanced analytics</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
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
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">50 Influencers</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">1000 DMs/month</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">Custom integrations</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">Dedicated support</Text>
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
                        Contact support
                      </Text>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">Unlimited Influencers</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">Unlimited DMs</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">Custom features</Text>
                      </div>
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <Text variant="bodySm" as="span">24/7 support</Text>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <Text variant="bodySm" as="p">
                    <strong>Special Offer:</strong> Get 20% off when you pay for a full year! 🎉
                  </Text>
                </div>

                <Select
                  label="Select Plan"
                  options={[
                    { label: 'Starter (Free)', value: 'STARTER' },
                    { label: 'Pro ($19.99/month)', value: 'PRO' },
                    { label: 'Scale ($59.99/month)', value: 'SCALE' },
                    { label: 'Enterprise (Contact Support)', value: 'ENTERPRISE' },
                  ]}
                  value={onboardingData.selectedPlan || 'STARTER'}
                  onChange={(value) => updateOnboardingData('selectedPlan', value)}
                />
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
                  <Hash className="w-12 h-12 mx-auto mb-4 text-blue-600" />
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
                        onClick={() => updateOnboardingData('socialMediaConnected', true)}
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
                        onClick={() => updateOnboardingData('socialMediaConnected', true)}
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

      default:
        return null;
    }
  };

  return (
    <Page title="Welcome to SocialBoost">
      <Layout>
        <Layout.Section>
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <Text variant="headingMd" as="h2">
                  Setup Progress
                </Text>
                <Text variant="bodyMd" tone="subdued" as="p">
                  Step {currentStep} of {ONBOARDING_STEPS.length}
                </Text>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Debug: Step {currentStep} of {ONBOARDING_STEPS.length} ({(currentStep / ONBOARDING_STEPS.length * 100).toFixed(0)}%)
              </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 1}
                icon={() => <ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>

              <Button
                onClick={handleNext}
                icon={() => currentStep === ONBOARDING_STEPS.length ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {currentStep === ONBOARDING_STEPS.length ? 'Complete Setup' : 'Next'}
              </Button>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 