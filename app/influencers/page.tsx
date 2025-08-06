'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Modal, TextField, Select, Badge, InlineStack, DataTable } from '@shopify/polaris';
import { useState } from 'react';
import { Search, Eye, Gift } from 'lucide-react';
import { useInfluencers } from '@/hooks/useInfluencers';
import { InfluencerAnalytics } from '@/components/InfluencerAnalytics';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAutomatedModal, setShowAutomatedModal] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isProcessingAutomated, setIsProcessingAutomated] = useState(false);
  const [automatedResults, setAutomatedResults] = useState<AutomatedCodeResult[]>([]);
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

  const getMerchantId = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop') || localStorage.getItem('shop');
    
    if (!shop) {
      throw new Error('No shop parameter found');
    }

    const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
    const merchantData = await merchantResponse.json();
    
    if (!merchantData.id) {
      throw new Error('Failed to fetch merchant data');
    }

    return merchantData.id;
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
    setIsProcessingAutomated(true);
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
    } finally {
      setIsProcessingAutomated(false);
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
          primaryAction={{
            content: 'Add Influencer',
            onAction: handleAddInfluencer,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowAddModal(false),
            },
          ]}
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
        </Modal>

        {/* Generate Discount Code Modal */}
        <Modal
          open={showDiscountModal}
          onClose={() => setShowDiscountModal(false)}
          title={`Generate Discount Code for ${selectedInfluencer?.name}`}
          primaryAction={{
            content: 'Generate Code',
            onAction: handleGenerateDiscountCode,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowDiscountModal(false),
            },
          ]}
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
        </Modal>

        {/* Automated Code Generation Modal */}
        <Modal
          open={showAutomatedModal}
          onClose={() => setShowAutomatedModal(false)}
          title="AI-Powered Automated Code Generation"
          primaryAction={{
            content: 'Generate Codes',
            onAction: handleAutomatedCodeGeneration,
            loading: isProcessingAutomated,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowAutomatedModal(false),
            },
          ]}
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
        </Modal>

        {/* Details Modal */}
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedInfluencer?.name} - Details`}
          primaryAction={{
            content: isEditingDetails ? 'Save Changes' : 'Edit',
            onAction: isEditingDetails ? handleSaveDetails : handleEditDetails,
          }}
          secondaryActions={[
            {
              content: isEditingDetails ? 'Cancel' : 'Close',
              onAction: isEditingDetails ? handleCancelEdit : () => setShowDetailsModal(false),
            },
          ]}
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
                      <Text variant="bodyMd" as="p">
                        {selectedInfluencer.discountCodes.length} codes
                        ({selectedInfluencer.discountCodes.filter(code => code.isActive).length} active)
                      </Text>
                    </div>
                  </>
                )}
              </BlockStack>
            )}
          </Modal.Section>
        </Modal>
      </Layout>
    </Page>
  );
} 