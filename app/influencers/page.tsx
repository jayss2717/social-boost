'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Modal, TextField, Select, Badge, InlineStack, DataTable } from '@shopify/polaris';
import { useState } from 'react';
import { Search, Eye, Gift, CreditCard } from 'lucide-react';
import { useInfluencers } from '@/hooks/useInfluencers';
import { InfluencerAnalytics } from '@/components/InfluencerAnalytics';
import { LoadingButton } from '@/components/LoadingButton';
import React from 'react';

interface Influencer {
  id: string;
  name: string;
  email: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  commissionRate: number;
  isActive: boolean;
  discountCodes: DiscountCode[];
  createdAt: string;
  stripeAccountId?: string;
  stripeAccountStatus?: 'NOT_CONNECTED' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'ERROR';
}

interface DiscountCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  expiresAt: string;
  uniqueLink: string;
}

interface AutomatedCodeResult {
  influencerId: string;
  influencerName: string;
  success: boolean;
  codes?: DiscountCode[];
  error?: string;
  aiOptimization?: {
    confidenceScore: number;
    strategy: string;
    reasoning: string[];
  };
}

export default function InfluencersPage() {
  const { data: influencers, isLoading, mutate } = useInfluencers();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAutomatedModal, setShowAutomatedModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContent, setEmailContent] = useState<{ subject: string; body: string; to: string } | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [automatedResults, setAutomatedResults] = useState<AutomatedCodeResult[]>([]);
  const [influencerSettings, setInfluencerSettings] = useState({
    autoApprove: false,
    minFollowers: 1000,
    minEngagementRate: 2.0,
    maxInfluencers: 1000,
    minPayoutAmount: 50,
    defaultCommissionRate: 10,
    maxCommissionRate: 25,
    minCommissionRate: 5,
    autoPayout: false,
    defaultDiscountPercentage: 20,
    maxDiscountPercentage: 50,
    minDiscountPercentage: 5,
    commissionCalculationBase: 'DISCOUNTED_AMOUNT' as 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    instagramHandle: '',
    tiktokHandle: '',
    commissionRate: 0.1,
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instagramHandle: '',
    tiktokHandle: '',
    commissionRate: 0.1,
  });

  const [discountFormData, setDiscountFormData] = useState({
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 20,
    usageLimit: 100,
    expiresAt: '',
  });

  const [automatedOptions, setAutomatedOptions] = useState({
    performanceBased: true,
    autoCreateShopify: true,
    strategy: 'all' as 'all' | 'high-value' | 'volume' | 'limited',
    aiOptimized: true,
    dynamicPricing: true,
    seasonalAdjustment: true,
  });

  // Fetch influencer settings on component mount
  React.useEffect(() => {
    fetchInfluencerSettings();
  }, []);

  const fetchInfluencerSettings = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        console.error('No merchant ID found');
        return;
      }

      const response = await fetch('/api/settings', {
        headers: {
          'x-merchant-id': merchantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setInfluencerSettings({
            autoApprove: data.data.influencerSettings?.autoApprove || false,
            minFollowers: data.data.influencerSettings?.minFollowers || 1000,
            minEngagementRate: data.data.influencerSettings?.minEngagementRate || 2.0,
            maxInfluencers: data.data.influencerSettings?.maxInfluencers || 1000,
            minPayoutAmount: data.data.influencerSettings?.minPayoutAmount || 50,
            defaultCommissionRate: data.data.influencerSettings?.defaultCommissionRate || 10,
            maxCommissionRate: data.data.influencerSettings?.maxCommissionRate || 25,
            minCommissionRate: data.data.influencerSettings?.minCommissionRate || 5,
            autoPayout: data.data.influencerSettings?.autoPayout || false,
            defaultDiscountPercentage: data.data.influencerSettings?.defaultDiscountPercentage || 20,
            maxDiscountPercentage: data.data.influencerSettings?.maxDiscountPercentage || 50,
            minDiscountPercentage: data.data.influencerSettings?.minDiscountPercentage || 5,
            commissionCalculationBase: data.data.commissionSettings?.commissionCalculationBase || 'DISCOUNTED_AMOUNT',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch influencer settings:', error);
    }
  };

  const saveInfluencerSettings = async () => {
    try {
      setIsSavingSettings(true);
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        console.error('No merchant ID found');
        return;
      }

      // Get current settings first
      const currentResponse = await fetch('/api/settings', {
        headers: {
          'x-merchant-id': merchantId,
        },
      });

      if (!currentResponse.ok) {
        console.error('Failed to fetch current settings');
        return;
      }

      const currentData = await currentResponse.json();
      const currentSettings = currentData.data;

      const updatedSettings = {
        ...currentSettings,
        influencerSettings: {
          autoApprove: influencerSettings.autoApprove,
          minFollowers: influencerSettings.minFollowers,
          minEngagementRate: influencerSettings.minEngagementRate,
          maxInfluencers: influencerSettings.maxInfluencers,
          minPayoutAmount: influencerSettings.minPayoutAmount,
        },
        commissionSettings: {
          ...currentSettings.commissionSettings,
          defaultRate: influencerSettings.defaultCommissionRate,
          maxRate: influencerSettings.maxCommissionRate,
          minRate: influencerSettings.minCommissionRate,
          autoPayout: influencerSettings.autoPayout,
          commissionCalculationBase: influencerSettings.commissionCalculationBase,
        },
        discountSettings: {
          ...currentSettings.discountSettings,
          defaultPercentage: influencerSettings.defaultDiscountPercentage,
          maxPercentage: influencerSettings.maxDiscountPercentage,
          minPercentage: influencerSettings.minDiscountPercentage,
        },
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(updatedSettings),
      });

      if (response.ok) {
        console.log('✅ Influencer settings saved successfully');
        setShowSettingsModal(false);
      } else {
        console.error('Failed to save influencer settings');
      }
    } catch (error) {
      console.error('Error saving influencer settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getMerchantId = async () => {
    // First try to get merchant ID from localStorage
    const storedMerchantId = localStorage.getItem('merchantId');
    if (storedMerchantId) {
      console.log('Using merchant ID from localStorage:', storedMerchantId);
      return storedMerchantId;
    }

    // If not in localStorage, try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop') || localStorage.getItem('shop');
    
    if (!shop) {
      throw new Error('No shop parameter found and no merchant ID in localStorage');
    }

    console.log('Fetching merchant data for shop:', shop);
    const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
    
    if (!merchantResponse.ok) {
      throw new Error('Failed to fetch merchant data');
    }
    
    const merchantData = await merchantResponse.json();
    
    if (!merchantData.id) {
      throw new Error('No merchant ID in response');
    }

    // Store the merchant ID in localStorage for future use
    localStorage.setItem('merchantId', merchantData.id);
    console.log('Stored merchant ID in localStorage:', merchantData.id);

    return merchantData.id;
  };

  const fetchStripeConnectStatus = async (influencerId: string) => {
    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch(`/api/influencers/${influencerId}/stripe-connect`, {
        headers: {
          'x-merchant-id': merchantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.stripeAccount.status;
      }
    } catch (error) {
      console.error('Error fetching Stripe Connect status:', error);
    }
    return 'NOT_CONNECTED';
  };

  // Filter influencers based on search query
  const filteredData = (influencers as Influencer[] || []).filter((influencer: Influencer) =>
    searchQuery.trim() === '' ||
    influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddInfluencer = async () => {
    try {
      // Get merchant ID first
      const merchantId = await getMerchantId();
      
      // Clean up form data - convert empty strings to undefined for optional fields
      const cleanedFormData: Record<string, unknown> = {
        name: formData.name,
        commissionRate: formData.commissionRate,
      };
      
      if (formData.email.trim()) {
        cleanedFormData.email = formData.email.trim();
      }
      if (formData.instagramHandle.trim()) {
        cleanedFormData.instagramHandle = formData.instagramHandle.trim();
      }
      if (formData.tiktokHandle.trim()) {
        cleanedFormData.tiktokHandle = formData.tiktokHandle.trim();
      }

      const response = await fetch('/api/influencers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          instagramHandle: '',
          tiktokHandle: '',
          commissionRate: 0.1,
        });
        mutate();
      } else {
        const errorData = await response.json();
        console.error('Failed to add influencer:', errorData);
      }
    } catch (error) {
      console.error('Failed to add influencer:', error);
    }
  };

  const handleGenerateDiscountCode = async () => {
    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify({
          influencerId: selectedInfluencer?.id,
          discountType: discountFormData.discountType,
          discountValue: discountFormData.discountValue,
          usageLimit: discountFormData.usageLimit,
          expiresAt: discountFormData.expiresAt || undefined,
        }),
      });

      if (response.ok) {
        setShowDiscountModal(false);
        setDiscountFormData({
          discountType: 'PERCENTAGE',
          discountValue: 20,
          usageLimit: 100,
          expiresAt: '',
        });
        mutate();
      } else {
        const errorData = await response.json();
        console.error('Failed to generate discount code:', errorData);
      }
    } catch (error) {
      console.error('Failed to generate discount code:', error);
    }
  };

  const handleAutomatedCodeGeneration = async () => {
    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/influencers/automated-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify({
          options: automatedOptions,
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setAutomatedResults(results.data || []);
        mutate();
      } else {
        const errorData = await response.json();
        console.error('Failed to generate automated codes:', errorData);
      }
    } catch (error) {
      console.error('Failed to generate automated codes:', error);
    }
  };

  const handleEditDetails = () => {
    if (selectedInfluencer) {
      setEditFormData({
        name: selectedInfluencer.name,
        email: selectedInfluencer.email || '',
        instagramHandle: selectedInfluencer.instagramHandle || '',
        tiktokHandle: selectedInfluencer.tiktokHandle || '',
        commissionRate: selectedInfluencer.commissionRate,
      });
      setIsEditingDetails(true);
    }
  };

  const handleSaveDetails = async () => {
    try {
      if (!selectedInfluencer) return;

      // Get merchant ID first
      const merchantId = await getMerchantId();

      const cleanedFormData: Record<string, unknown> = {
        name: editFormData.name,
        commissionRate: editFormData.commissionRate,
      };
      
      if (editFormData.email.trim()) {
        cleanedFormData.email = editFormData.email.trim();
      }
      if (editFormData.instagramHandle.trim()) {
        cleanedFormData.instagramHandle = editFormData.instagramHandle.trim();
      }
      if (editFormData.tiktokHandle.trim()) {
        cleanedFormData.tiktokHandle = editFormData.tiktokHandle.trim();
      }

      const response = await fetch(`/api/influencers/${selectedInfluencer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        setIsEditingDetails(false);
        mutate();
      } else {
        const errorData = await response.json();
        console.error('Failed to update influencer:', errorData);
      }
    } catch (error) {
      console.error('Failed to update influencer:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDetails(false);
  };

  const handleStripeConnect = async (influencerId: string) => {
    try {
      const merchantId = await getMerchantId();
      
      const response = await fetch(`/api/influencers/${influencerId}/stripe-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Open the onboarding URL in a new window
        window.open(data.data.onboardingUrl, '_blank', 'width=800,height=600');
      } else {
        const errorData = await response.json();
        console.error('Failed to create Stripe Connect account:', errorData);
      }
    } catch (error) {
      console.error('Failed to create Stripe Connect account:', error);
    }
  };

  if (isLoading) {
    return (
      <Page title="Influencers">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const activeInfluencers = filteredData.filter(inf => inf.isActive).length;
  const totalDiscountCodes = filteredData.reduce((sum, inf) => sum + inf.discountCodes.length, 0);
  const activeDiscountCodes = filteredData.reduce((sum, inf) => 
    sum + inf.discountCodes.filter(code => code.isActive).length, 0
  );

  return (
    <Page
      title="Influencers"
      primaryAction={{
        content: 'Add Influencer',
        onAction: () => setShowAddModal(true),
      }}
      secondaryActions={[
        {
          content: 'Analytics',
          onAction: () => setShowAnalytics(!showAnalytics),
        },
        {
          content: 'Automated Codes',
          onAction: () => setShowAutomatedModal(true),
        },
        {
          content: 'Settings',
          onAction: () => setShowSettingsModal(true),
        },
      ]}
    >
      <Layout>
        {/* Summary Cards */}
        <Layout.Section>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <Card>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="p" tone="success">
                  {activeInfluencers}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Active Influencers
                </Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="p" tone="success">
                  {totalDiscountCodes}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Total Codes
                </Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="p" tone="success">
                  {activeDiscountCodes}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Active Codes
                </Text>
              </div>
            </Card>
          </div>
        </Layout.Section>

        {/* Analytics View */}
        {showAnalytics && (
          <Layout.Section>
            <InfluencerAnalytics 
              influencers={filteredData}
              payouts={[]} // TODO: Fetch payouts data
              discountCodes={filteredData.reduce((codes, inf) => [...codes, ...inf.discountCodes], [] as DiscountCode[])}
            />
          </Layout.Section>
        )}

        {/* Main Content */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div className="mb-6">
                <TextField
                  label="Search influencers"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name or email"
                  prefix={<Search className="w-4 h-4" />}
                  clearButton
                  onClearButtonClick={() => setSearchQuery('')}
                  autoComplete="off"
                />
              </div>

              <div className="w-full">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Name', 'Contact', 'Commission', 'Codes', 'Status', 'Actions']}
                  rows={filteredData.map((influencer) => [
                    <div key={`${influencer.id}-name`}>
                      <div className="font-semibold">{influencer.name}</div>
                      <div className="text-sm text-gray-500">
                        {(influencer.commissionRate * 100).toFixed(1)}% commission
                      </div>
                    </div>,
                    <div key={`${influencer.id}-contact`}>
                      <div>{influencer.email || 'No email'}</div>
                      <div className="text-sm text-gray-500">
                        {influencer.instagramHandle && `@${influencer.instagramHandle}`}
                        {influencer.tiktokHandle && influencer.instagramHandle && ' • '}
                        {influencer.tiktokHandle && `@${influencer.tiktokHandle}`}
                      </div>
                    </div>,
                    <div key={`${influencer.id}-commission`}>
                      <Badge tone="success">
                        {`${(influencer.commissionRate * 100).toFixed(1)}%`}
                      </Badge>
                    </div>,
                    <div key={`${influencer.id}-codes`}>
                      <div>{influencer.discountCodes.length} codes</div>
                      <div className="text-sm text-gray-500">
                        {influencer.discountCodes.filter(code => code.isActive).length} active
                      </div>
                    </div>,
                    <div key={`${influencer.id}-status`}>
                      <Badge tone={influencer.isActive ? 'success' : 'critical'}>
                        {`${influencer.isActive ? 'Active' : 'Inactive'}`}
                      </Badge>
                    </div>,
                    <div key={`${influencer.id}-actions`}>
                      <InlineStack gap="200">
                        <div title="View influencer details">
                          <Button
                            size="slim"
                            onClick={() => {
                              setSelectedInfluencer(influencer);
                              setShowDetailsModal(true);
                            }}
                            icon={() => React.createElement(Eye, { className: "w-4 h-4" })}
                          >
                            Details
                          </Button>
                        </div>
                        {influencer.discountCodes.length > 0 && (
                          <div title="View discount codes">
                            <Button
                              size="slim"
                              variant="secondary"
                              onClick={() => {
                                setSelectedInfluencer(influencer);
                                setShowDetailsModal(true);
                              }}
                            >
                              View Codes ({influencer.discountCodes.length.toString()})
                            </Button>
                          </div>
                        )}
                        <div title="Generate discount code">
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => {
                              setSelectedInfluencer(influencer);
                              setShowDiscountModal(true);
                            }}
                            icon={() => React.createElement(Gift, { className: "w-4 h-4" })}
                          >
                            Generate Code
                          </Button>
                        </div>
                        <div title="Setup Stripe Connect for payouts">
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => handleStripeConnect(influencer.id)}
                            icon={() => React.createElement(CreditCard, { className: "w-4 h-4" })}
                          >
                            Stripe Connect
                          </Button>
                        </div>
                      </InlineStack>
                    </div>
                  ])}
                />
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-8">
                  <Text variant="bodyMd" tone="subdued" as="p">
                    No influencers found. Add your first influencer to get started.
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Add Influencer Modal */}
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Influencer"
        >
          <Modal.Section>
            <BlockStack gap="400">
              <TextField
                label="Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                autoComplete="off"
              />
              <TextField
                label="Email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                autoComplete="off"
              />
              <TextField
                label="Instagram Handle"
                value={formData.instagramHandle}
                onChange={(value) => setFormData({ ...formData, instagramHandle: value })}
                placeholder="@username"
                autoComplete="off"
              />
              <TextField
                label="TikTok Handle"
                value={formData.tiktokHandle}
                onChange={(value) => setFormData({ ...formData, tiktokHandle: value })}
                placeholder="@username"
                autoComplete="off"
              />
              <TextField
                label="Commission Rate (%)"
                type="number"
                value={String(formData.commissionRate * 100)}
                onChange={(value) => setFormData({ ...formData, commissionRate: parseFloat(value) / 100 })}
                suffix="%"
                autoComplete="off"
              />
            </BlockStack>
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="primary"
                onClick={handleAddInfluencer}
                loadingText="Adding Influencer..."
              >
                Add Influencer
              </LoadingButton>
            </InlineStack>
          </Modal.Section>
        </Modal>

        {/* Generate Discount Code Modal */}
        <Modal
          open={showDiscountModal}
          onClose={() => setShowDiscountModal(false)}
          title={`Generate Discount Code for ${selectedInfluencer?.name}`}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Select
                label="Discount Type"
                options={[
                  { label: 'Percentage', value: 'PERCENTAGE' },
                  { label: 'Fixed Amount', value: 'FIXED_AMOUNT' },
                ]}
                value={discountFormData.discountType}
                onChange={(value) => setDiscountFormData({ ...discountFormData, discountType: value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
              />
              <TextField
                label="Discount Value"
                type="number"
                value={String(discountFormData.discountValue)}
                onChange={(value) => setDiscountFormData({ ...discountFormData, discountValue: parseFloat(value) })}
                suffix={discountFormData.discountType === 'PERCENTAGE' ? '%' : '$'}
                autoComplete="off"
              />
              <TextField
                label="Usage Limit"
                type="number"
                value={String(discountFormData.usageLimit)}
                onChange={(value) => setDiscountFormData({ ...discountFormData, usageLimit: parseInt(value) })}
                autoComplete="off"
              />
              <TextField
                label="Expires At"
                type="date"
                value={discountFormData.expiresAt}
                onChange={(value) => setDiscountFormData({ ...discountFormData, expiresAt: value })}
                autoComplete="off"
              />
            </BlockStack>
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={() => setShowDiscountModal(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="primary"
                onClick={handleGenerateDiscountCode}
                loadingText="Generating Code..."
              >
                Generate Code
              </LoadingButton>
            </InlineStack>
          </Modal.Section>
        </Modal>

        {/* Automated Code Generation Modal */}
        <Modal
          open={showAutomatedModal}
          onClose={() => setShowAutomatedModal(false)}
          title="AI-Powered Automated Code Generation"
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd" as="p">
                Automatically generate AI-optimized discount codes based on influencer performance, market conditions, and seasonal factors.
              </Text>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={automatedOptions.performanceBased}
                  onChange={(e) => setAutomatedOptions({
                    ...automatedOptions,
                    performanceBased: e.target.checked
                  })}
                />
                <Text variant="bodyMd" as="p">
                  Performance-based optimization
                </Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={automatedOptions.autoCreateShopify}
                  onChange={(e) => setAutomatedOptions({
                    ...automatedOptions,
                    autoCreateShopify: e.target.checked
                  })}
                />
                <Text variant="bodyMd" as="p">
                  Auto-create in Shopify
                </Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={automatedOptions.aiOptimized}
                  onChange={(e) => setAutomatedOptions({
                    ...automatedOptions,
                    aiOptimized: e.target.checked
                  })}
                />
                <Text variant="bodyMd" as="p">
                  AI-powered optimization
                </Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={automatedOptions.dynamicPricing}
                  onChange={(e) => setAutomatedOptions({
                    ...automatedOptions,
                    dynamicPricing: e.target.checked
                  })}
                />
                <Text variant="bodyMd" as="p">
                  Dynamic pricing based on market conditions
                </Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={automatedOptions.seasonalAdjustment}
                  onChange={(e) => setAutomatedOptions({
                    ...automatedOptions,
                    seasonalAdjustment: e.target.checked
                  })}
                />
                <Text variant="bodyMd" as="p">
                  Seasonal adjustments
                </Text>
              </div>

              <Select
                label="Generation Strategy"
                options={[
                  { label: 'All Strategies', value: 'all' },
                  { label: 'High Value', value: 'high-value' },
                  { label: 'Volume', value: 'volume' },
                  { label: 'Limited Edition', value: 'limited' },
                ]}
                value={automatedOptions.strategy}
                onChange={(value) => setAutomatedOptions({
                  ...automatedOptions,
                  strategy: value as 'all' | 'high-value' | 'volume' | 'limited'
                })}
              />

              {automatedResults.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    AI Generation Results:
                  </Text>
                  {automatedResults.map((result, index) => (
                    <div key={index} style={{ marginTop: '0.5rem' }}>
                      <Text variant="bodySm" as="p">
                        {result.influencerName}: {result.success ? 'Success' : 'Failed'}
                        {result.success && result.codes && (
                          <span> - {result.codes.length} codes generated</span>
                        )}
                        {result.aiOptimization && (
                          <span> (Confidence: {(result.aiOptimization.confidenceScore * 100).toFixed(1)}%)</span>
                        )}
                      </Text>
                      {result.aiOptimization && result.aiOptimization.reasoning && (
                        <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                          {result.aiOptimization.reasoning.map((reason: string, i: number) => (
                            <Text key={i} variant="bodySm" as="p" tone="subdued">
                              • {reason}
                            </Text>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </BlockStack>
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={() => setShowAutomatedModal(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="primary"
                onClick={handleAutomatedCodeGeneration}
                loadingText="Generating Codes..."
              >
                Generate Codes
              </LoadingButton>
            </InlineStack>
          </Modal.Section>
        </Modal>

        {/* Details Modal */}
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedInfluencer?.name} - Details`}
        >
          <Modal.Section>
            {selectedInfluencer && (
              <BlockStack gap="400">
                {isEditingDetails ? (
                  <>
                    <TextField
                      label="Name"
                      value={editFormData.name}
                      onChange={(value) => setEditFormData({ ...editFormData, name: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Email"
                      value={editFormData.email}
                      onChange={(value) => setEditFormData({ ...editFormData, email: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Instagram Handle"
                      value={editFormData.instagramHandle}
                      onChange={(value) => setEditFormData({ ...editFormData, instagramHandle: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="TikTok Handle"
                      value={editFormData.tiktokHandle}
                      onChange={(value) => setEditFormData({ ...editFormData, tiktokHandle: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Commission Rate (%)"
                      type="number"
                      value={String(editFormData.commissionRate * 100)}
                      onChange={(value) => setEditFormData({ ...editFormData, commissionRate: parseFloat(value) / 100 })}
                      suffix="%"
                      autoComplete="off"
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Name
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedInfluencer.name}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Email
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedInfluencer.email || 'No email'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Instagram
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedInfluencer.instagramHandle ? `@${selectedInfluencer.instagramHandle}` : 'Not set'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        TikTok
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedInfluencer.tiktokHandle ? `@${selectedInfluencer.tiktokHandle}` : 'Not set'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Commission Rate
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {(selectedInfluencer.commissionRate * 100).toFixed(1)}%
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Status
                      </Text>
                      <Badge tone={selectedInfluencer.isActive ? 'success' : 'critical'}>
                        {selectedInfluencer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Discount Codes
                      </Text>
                      {selectedInfluencer.discountCodes.length > 0 ? (
                        <BlockStack gap="200">
                          {selectedInfluencer.discountCodes.map((code) => (
                            <Card key={code.id} padding="300">
                              <BlockStack gap="200">
                                <InlineStack align="space-between">
                                  <div>
                                    <Text variant="bodyMd" fontWeight="semibold" as="p">
                                      {code.code}
                                    </Text>
                                    <Text variant="bodySm" tone="subdued" as="p">
                                      {code.discountType === 'PERCENTAGE' ? `${code.discountValue}% off` : `$${code.discountValue} off`}
                                      {code.usageLimit && ` • ${code.usageCount}/${code.usageLimit} uses`}
                                      {code.expiresAt && ` • Expires ${new Date(code.expiresAt).toLocaleDateString()}`}
                                    </Text>
                                  </div>
                                  <Badge tone={code.isActive ? 'success' : 'critical'}>
                                    {code.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </InlineStack>
                                {code.uniqueLink && (
                                  <div>
                                    <Text variant="bodySm" tone="subdued" as="p">
                                      Link: {code.uniqueLink.replace('{code}', code.code)}
                                    </Text>
                                  </div>
                                )}
                                <InlineStack gap="200">
                                  <Button
                                    size="slim"
                                    variant="secondary"
                                    onClick={() => {
                                      navigator.clipboard.writeText(code.code);
                                      // You could add a toast notification here
                                    }}
                                  >
                                    Copy Code
                                  </Button>
                                  {code.uniqueLink && (
                                    <Button
                                      size="slim"
                                      variant="secondary"
                                                                             onClick={() => {
                                         const actualLink = code.uniqueLink?.replace('{code}', code.code) || code.uniqueLink;
                                         navigator.clipboard.writeText(actualLink);
                                         // You could add a toast notification here
                                       }}
                                    >
                                      Copy Link
                                    </Button>
                                  )}
                                  <Button
                                    size="slim"
                                    variant="primary"
                                    onClick={() => {
                                      // Create email content
                                      const subject = `Your Discount Code: ${code.code}`;
                                      const body = 
`Hi ${selectedInfluencer.name},

Here's your exclusive discount code: ${code.code}

Discount: ${code.discountType === 'PERCENTAGE' ? `${code.discountValue}% off` : `$${code.discountValue} off`}
${code.uniqueLink ? `Direct link: ${code.uniqueLink.replace('{code}', code.code)}` : ''}

Thank you for your partnership!

Best regards,
Your Brand Team`;

                                      // Show email modal with content
                                      setEmailContent({
                                        subject,
                                        body,
                                        to: selectedInfluencer.email
                                      });
                                      setShowEmailModal(true);
                                    }}
                                  >
                                    Send Email
                                  </Button>
                                </InlineStack>
                              </BlockStack>
                            </Card>
                          ))}
                        </BlockStack>
                      ) : (
                        <Text variant="bodyMd" as="p">
                          No discount codes generated yet
                        </Text>
                      )}
                    </div>
                  </>
                )}
              </BlockStack>
            )}
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={isEditingDetails ? handleCancelEdit : () => setShowDetailsModal(false)}
              >
                {isEditingDetails ? 'Cancel' : 'Close'}
              </Button>
              {isEditingDetails ? (
                <LoadingButton
                  variant="primary"
                  onClick={handleSaveDetails}
                  loadingText="Saving Changes..."
                >
                  Save Changes
                </LoadingButton>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleEditDetails}
                >
                  Edit
                </Button>
              )}
            </InlineStack>
          </Modal.Section>
        </Modal>

        {/* Email Modal */}
        <Modal
          open={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          title="Send Email to Influencer"
        >
          <Modal.Section>
            {emailContent && (
              <BlockStack gap="400">
                <div>
                  <Text variant="bodySm" tone="subdued" as="p">
                    To
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {emailContent.to}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Subject
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {emailContent.subject}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Message
                  </Text>
                  <div style={{ 
                    backgroundColor: '#f6f6f6', 
                    padding: '12px', 
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {emailContent.body}
                  </div>
                </div>
              </BlockStack>
            )}
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (emailContent) {
                    navigator.clipboard.writeText(`Subject: ${emailContent.subject}\n\n${emailContent.body}`);
                    alert('Email content copied to clipboard!');
                  }
                }}
              >
                Copy to Clipboard
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (emailContent) {
                    const mailtoLink = `mailto:${emailContent.to}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
                    window.open(mailtoLink);
                    setShowEmailModal(false);
                  }
                }}
              >
                Open Email Client
              </Button>
            </InlineStack>
          </Modal.Section>
        </Modal>

        {/* Influencer Settings Modal */}
        <Modal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Influencer Settings"
        >
          <Modal.Section>
            <BlockStack gap="400">
              {/* Influencer Management Settings */}
              <div>
                <Text variant="headingMd" as="h3">
                  Influencer Management
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Select
                    label="Auto-Approve Influencers"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={influencerSettings.autoApprove ? 'true' : 'false'}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      autoApprove: value === 'true'
                    })}
                  />
                  <TextField
                    label="Minimum Follower Count"
                    type="number"
                    value={String(influencerSettings.minFollowers)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      minFollowers: parseInt(value) || 0
                    })}
                    min="0"
                    autoComplete="off"
                  />
                  <TextField
                    label="Minimum Engagement Rate (%)"
                    type="number"
                    value={String(influencerSettings.minEngagementRate)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      minEngagementRate: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    step={0.1}
                    autoComplete="off"
                  />
                  <TextField
                    label="Maximum Influencers"
                    type="number"
                    value={String(influencerSettings.maxInfluencers)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      maxInfluencers: parseInt(value) || 0
                    })}
                    min="1"
                    max="10000"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    Auto-approve influencers with {influencerSettings.minFollowers}+ followers and {influencerSettings.minEngagementRate}%+ engagement rate. 
                    Maximum {influencerSettings.maxInfluencers} influencers allowed.
                  </Text>
                </div>
              </div>

              {/* Commission Configuration */}
              <div>
                <Text variant="headingMd" as="h3">
                  Commission Configuration
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <TextField
                    label="Default Commission Rate (%)"
                    type="number"
                    value={String(influencerSettings.defaultCommissionRate)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      defaultCommissionRate: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                  <TextField
                    label="Minimum Commission (%)"
                    type="number"
                    value={String(influencerSettings.minCommissionRate)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      minCommissionRate: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                  <TextField
                    label="Maximum Commission (%)"
                    type="number"
                    value={String(influencerSettings.maxCommissionRate)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      maxCommissionRate: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    Default commission rate: {influencerSettings.defaultCommissionRate}%. 
                    Range: {influencerSettings.minCommissionRate}% - {influencerSettings.maxCommissionRate}%.
                  </Text>
                </div>
              </div>

              {/* Discount Configuration */}
              <div>
                <Text variant="headingMd" as="h3">
                  Discount Configuration
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <TextField
                    label="Default Discount (%)"
                    type="number"
                    value={String(influencerSettings.defaultDiscountPercentage)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      defaultDiscountPercentage: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                  <TextField
                    label="Minimum Discount (%)"
                    type="number"
                    value={String(influencerSettings.minDiscountPercentage)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      minDiscountPercentage: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                  <TextField
                    label="Maximum Discount (%)"
                    type="number"
                    value={String(influencerSettings.maxDiscountPercentage)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      maxDiscountPercentage: parseFloat(value) || 0
                    })}
                    min="0"
                    max="100"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    Default discount: {influencerSettings.defaultDiscountPercentage}%. 
                    Range: {influencerSettings.minDiscountPercentage}% - {influencerSettings.maxDiscountPercentage}%.
                  </Text>
                </div>
              </div>

              {/* Payout Configuration */}
              <div>
                <Text variant="headingMd" as="h3">
                  Payout Configuration
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Select
                    label="Auto-Payout"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={influencerSettings.autoPayout ? 'true' : 'false'}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      autoPayout: value === 'true'
                    })}
                  />
                  <TextField
                    label="Minimum Payout Amount ($)"
                    type="number"
                    value={String(influencerSettings.minPayoutAmount)}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      minPayoutAmount: parseFloat(value) || 0
                    })}
                    min="0"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    {influencerSettings.autoPayout ? 'Automatically' : 'Manually'} process payouts when balance reaches ${influencerSettings.minPayoutAmount}.
                  </Text>
                </div>
              </div>

              {/* Commission Calculation Preference */}
              <div>
                <Text variant="headingMd" as="h3">
                  Commission Calculation Preference
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Select
                    label="Commission Calculation Base"
                    options={[
                      { label: 'Discounted Amount', value: 'DISCOUNTED_AMOUNT' },
                      { label: 'Original Amount', value: 'ORIGINAL_AMOUNT' },
                    ]}
                    value={influencerSettings.commissionCalculationBase}
                    onChange={(value) => setInfluencerSettings({
                      ...influencerSettings,
                      commissionCalculationBase: value as 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT'
                    })}
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    Choose how commissions are calculated for influencer payouts.
                    <br />
                                         &quot;Discounted Amount&quot; means the commission is based on the price after applying the discount.
                     <br />
                     &quot;Original Amount&quot; means the commission is based on the full price before the discount.
                  </Text>
                </div>
              </div>
            </BlockStack>
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={() => setShowSettingsModal(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="primary"
                onClick={saveInfluencerSettings}
                loadingText="Saving Settings..."
                loading={isSavingSettings}
              >
                Save Settings
              </LoadingButton>
            </InlineStack>
          </Modal.Section>
        </Modal>
      </Layout>
    </Page>
  );
} 