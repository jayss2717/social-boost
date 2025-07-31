'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Modal, TextField, Select, Badge, Banner, InlineStack, DataTable } from '@shopify/polaris';
import { useState } from 'react';
import { Plus, Copy, Gift, Search, Eye, Trash } from 'lucide-react';
import { useInfluencers } from '@/hooks/useInfluencers';

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

export default function InfluencersPage() {
  const { data: influencers, isLoading, error, mutate } = useInfluencers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
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

  const getMerchantId = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop') || localStorage.getItem('shop');
    
    if (!shop) {
      throw new Error('No shop parameter found');
    }

    const merchantResponse = await fetch(`/api/merchant?shop=${shop}`);
    const merchantData = await merchantResponse.json();
    
    if (!merchantData.success || !merchantData.merchant) {
      throw new Error('Failed to fetch merchant data');
    }

    return merchantData.merchant.id;
  };

  // Filter influencers based on search query
  const filteredData = (influencers as Influencer[] || []).filter((influencer: Influencer) =>
    searchQuery.trim() === '' ||
    influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddInfluencer = async () => {
    try {
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

      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
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
        mutate(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Failed to add influencer:', errorData);
      }
    } catch (error) {
      console.error('Failed to add influencer:', error);
    }
  };

  const handleGenerateDiscountCode = async () => {
    if (!selectedInfluencer) return;

    try {
      // Clean up discount form data - convert empty string to undefined for expiresAt
      const cleanedDiscountData = {
        influencerId: selectedInfluencer.id,
        discountType: discountFormData.discountType,
        discountValue: discountFormData.discountValue,
        usageLimit: discountFormData.usageLimit,
        expiresAt: discountFormData.expiresAt.trim() 
          ? new Date(discountFormData.expiresAt + 'T23:59:59.000Z').toISOString()
          : undefined,
      };

      const merchantId = await getMerchantId();
      
      const response = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify(cleanedDiscountData),
      });

      if (response.ok) {
        const newDiscountCode = await response.json();
        setShowDiscountModal(false);
        setDiscountFormData({
          discountType: 'PERCENTAGE',
          discountValue: 20,
          usageLimit: 100,
          expiresAt: '',
        });
        
        // Update the selectedInfluencer state to include the new code
        if (selectedInfluencer) {
          setSelectedInfluencer({
            ...selectedInfluencer,
            discountCodes: [...selectedInfluencer.discountCodes, newDiscountCode]
          });
        }
        
        mutate(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Failed to generate discount code:', errorData);
      }
    } catch (error) {
      console.error('Failed to generate discount code:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteDiscountCode = async (discountCodeId: string) => {
    if (!confirm('Are you sure you want to delete this discount code? This action cannot be undone.')) {
      return;
    }

    try {
      const merchantId = await getMerchantId();
      console.log('Attempting to delete discount code:', discountCodeId);
      const response = await fetch(`/api/discount-codes/${discountCodeId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
      });

      if (response.ok) {
        console.log('Discount code deleted successfully');
        // Update the selectedInfluencer state to remove the deleted code
        if (selectedInfluencer) {
          setSelectedInfluencer({
            ...selectedInfluencer,
            discountCodes: selectedInfluencer.discountCodes.filter(code => code.id !== discountCodeId)
          });
        }
        mutate(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Failed to delete discount code:', errorData);
      }
    } catch (error) {
      console.error('Failed to delete discount code:', error);
    }
  };

  const handleDeleteInfluencer = async (influencerId: string) => {
    if (!confirm('Are you sure you want to delete this influencer? This action cannot be undone.')) {
      return;
    }

    try {
      const merchantId = await getMerchantId();
      const response = await fetch(`/api/influencers/${influencerId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
      });

      if (response.ok) {
        mutate(); // Refresh data
        console.log('Influencer deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete influencer:', errorData);
      }
    } catch (error) {
      console.error('Failed to delete influencer:', error);
    }
  };

  const handleEditDetails = () => {
    if (selectedInfluencer) {
      setEditFormData({
        name: selectedInfluencer.name,
        email: selectedInfluencer.email,
        instagramHandle: selectedInfluencer.instagramHandle || '',
        tiktokHandle: selectedInfluencer.tiktokHandle || '',
        commissionRate: selectedInfluencer.commissionRate,
      });
      setIsEditingDetails(true);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedInfluencer) return;

    try {
      // Clean up edit form data - convert empty strings to undefined for optional fields
      const cleanedEditFormData: Record<string, unknown> = {
        name: editFormData.name,
        commissionRate: editFormData.commissionRate,
      };
      
      if (editFormData.email.trim()) {
        cleanedEditFormData.email = editFormData.email.trim();
      }
      if (editFormData.instagramHandle.trim()) {
        cleanedEditFormData.instagramHandle = editFormData.instagramHandle.trim();
      }
      if (editFormData.tiktokHandle.trim()) {
        cleanedEditFormData.tiktokHandle = editFormData.tiktokHandle.trim();
      }

      const merchantId = await getMerchantId();
      const response = await fetch(`/api/influencers/${selectedInfluencer.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId
        },
        body: JSON.stringify(cleanedEditFormData),
      });

      if (response.ok) {
        setIsEditingDetails(false);
        mutate(); // Refresh data
        console.log('Influencer details updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update influencer details:', errorData);
      }
    } catch (error) {
      console.error('Failed to update influencer details:', error);
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

  if (error) {
    return (
      <Page title="Influencers">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Error Loading Influencers
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    {error.message}
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={() => mutate()}>
                      Retry
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
    <Page
      title="Influencers"
      primaryAction={{
        content: 'Add Influencer',
        icon: () => <Plus size={20} />,
        onAction: () => setShowAddModal(true),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div className="p-6 w-full">
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
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Full Name', 'Email', 'Commission', 'Status', 'Actions']}
                  rows={filteredData.map((influencer) => [
                    influencer.name,
                    influencer.email,
                    `${(influencer.commissionRate * 100).toFixed(1)}%`,
                    <Badge key={influencer.id} tone={influencer.isActive ? 'success' : 'critical'}>
                      {influencer.isActive ? 'Active' : 'Inactive'}
                    </Badge>,
                    <InlineStack key={influencer.id} gap="200">
                      <div title="View influencer details and discount codes">
                        <Button
                          size="slim"
                          onClick={() => {
                            setSelectedInfluencer(influencer);
                            setShowDetailsModal(true);
                          }}
                          icon={<Eye className="w-4 h-4" />}
                        >
                          Details
                        </Button>
                      </div>
                      <div title="Generate a new discount code for this influencer">
                        <Button
                          size="slim"
                          variant="secondary"
                          onClick={() => {
                            setSelectedInfluencer(influencer);
                            setShowDiscountModal(true);
                          }}
                          icon={<Gift className="w-4 h-4" />}
                        >
                          Generate Code
                        </Button>
                      </div>
                      <div title="Delete this influencer permanently">
                        <Button
                          size="slim"
                          variant="secondary"
                          onClick={() => handleDeleteInfluencer(influencer.id)}
                          icon={<Trash className="w-4 h-4" />}
                          tone="critical"
                        >
                          Delete
                        </Button>
                      </div>
                    </InlineStack>
                  ])}
                />
              </div>
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
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Text variant="bodySm" tone="subdued" as="p">
                <strong>Form Requirements:</strong> Fields marked with * are required. Optional fields can be left empty.
              </Text>
            </div>
            <BlockStack gap="400">
              <TextField
                label="Name *"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                autoComplete="off"
                helpText="Required: The influencer's full name"
              />
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                autoComplete="off"
                helpText="Optional: Contact email for the influencer"
              />
              <TextField
                label="Instagram Handle"
                value={formData.instagramHandle}
                onChange={(value) => setFormData({ ...formData, instagramHandle: value })}
                autoComplete="off"
                placeholder="@username"
                helpText="Optional: Instagram username without @ symbol (e.g., username)"
              />
              <TextField
                label="TikTok Handle"
                value={formData.tiktokHandle}
                onChange={(value) => setFormData({ ...formData, tiktokHandle: value })}
                autoComplete="off"
                placeholder="@username"
                helpText="Optional: TikTok username without @ symbol (e.g., username)"
              />
              <TextField
                label="Commission Rate (%) *"
                type="number"
                value={String(formData.commissionRate * 100)}
                onChange={(value) => {
                  const parsed = parseFloat(value);
                  if (!isNaN(parsed)) {
                    setFormData({ ...formData, commissionRate: parsed / 100 });
                  }
                }}
                autoComplete="off"
                min={0}
                max={100}
                step={0.1}
                helpText="Required: Percentage commission the influencer will earn (e.g., 10 for 10%)"
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
                label={discountFormData.discountType === 'PERCENTAGE' ? 'Discount Percentage' : 'Discount Amount ($)'}
                type="number"
                value={discountFormData.discountValue.toString()}
                onChange={(value) => {
                  const parsed = parseFloat(value);
                  if (!isNaN(parsed)) {
                    setDiscountFormData({ ...discountFormData, discountValue: parsed });
                  }
                }}
                autoComplete="off"
                min={0}
                max={discountFormData.discountType === 'PERCENTAGE' ? 100 : 1000}
                step={0.1}
              />
              <TextField
                label="Usage Limit"
                type="number"
                value={discountFormData.usageLimit.toString()}
                onChange={(value) => {
                  const parsed = parseInt(value);
                  if (!isNaN(parsed)) {
                    setDiscountFormData({ ...discountFormData, usageLimit: parsed });
                  }
                }}
                autoComplete="off"
                min={1}
                max={10000}
              />
              <TextField
                label="Expires At (Optional)"
                type="date"
                value={discountFormData.expiresAt}
                onChange={(value) => setDiscountFormData({ ...discountFormData, expiresAt: value })}
                autoComplete="off"
              />
            </BlockStack>
          </Modal.Section>
        </Modal>

        {/* Details Modal */}
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedInfluencer?.name} - Details`}
          primaryAction={
            isEditingDetails 
              ? {
                  content: 'Save',
                  onAction: handleSaveDetails,
                }
              : {
                  content: 'Close',
                  onAction: () => setShowDetailsModal(false),
                }
          }
          secondaryActions={
            isEditingDetails 
              ? [
                  {
                    content: 'Cancel',
                    onAction: handleCancelEdit,
                  },
                ]
              : [
                  {
                    content: 'Edit',
                    onAction: handleEditDetails,
                  },
                ]
          }
        >
          <Modal.Section>
            {selectedInfluencer && (
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3">
                    Personal Information
                  </Text>
                  <div className="mt-3 space-y-4">
                    {isEditingDetails ? (
                      <>
                        <TextField
                          label="Full Name"
                          value={editFormData.name}
                          onChange={(value) => setEditFormData({ ...editFormData, name: value })}
                          autoComplete="off"
                        />
                        <TextField
                          label="Email"
                          type="email"
                          value={editFormData.email}
                          onChange={(value) => setEditFormData({ ...editFormData, email: value })}
                          autoComplete="off"
                        />
                      </>
                    ) : (
                      <>
                        <div>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Full Name
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
                            {selectedInfluencer.email}
                          </Text>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="headingMd" as="h3">
                    Social Media
                  </Text>
                  <div className="mt-3 space-y-4">
                    {isEditingDetails ? (
                      <>
                        <TextField
                          label="Instagram Handle"
                          value={editFormData.instagramHandle}
                          onChange={(value) => setEditFormData({ ...editFormData, instagramHandle: value })}
                          placeholder="@username"
                          autoComplete="off"
                        />
                        <TextField
                          label="TikTok Handle"
                          value={editFormData.tiktokHandle}
                          onChange={(value) => setEditFormData({ ...editFormData, tiktokHandle: value })}
                          placeholder="@username"
                          autoComplete="off"
                        />
                      </>
                    ) : (
                      <>
                        {selectedInfluencer.instagramHandle && (
                          <div>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Instagram
                            </Text>
                            <Text variant="bodyMd" as="p">
                              @{selectedInfluencer.instagramHandle}
                            </Text>
                          </div>
                        )}
                        {selectedInfluencer.tiktokHandle && (
                          <div>
                            <Text variant="bodySm" tone="subdued" as="p">
                              TikTok
                            </Text>
                            <Text variant="bodyMd" as="p">
                              @{selectedInfluencer.tiktokHandle}
                            </Text>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="headingMd" as="h3">
                    Business Information
                  </Text>
                  <div className="mt-3 space-y-4">
                    {isEditingDetails ? (
                      <TextField
                        label="Commission Rate (%)"
                        type="number"
                        value={(editFormData.commissionRate * 100).toString()}
                        onChange={(value) => {
                          const parsed = parseFloat(value);
                          if (!isNaN(parsed)) {
                            setEditFormData({ 
                              ...editFormData, 
                              commissionRate: parsed / 100 
                            });
                          }
                        }}
                        autoComplete="off"
                        min={0}
                        max={100}
                        step={0.1}
                      />
                    ) : (
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Commission Rate
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {(selectedInfluencer.commissionRate * 100).toFixed(1)}%
                        </Text>
                      </div>
                    )}
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
                        {selectedInfluencer.discountCodes?.length || 0} codes generated
                      </Text>
                    </div>
                  </div>
                </div>

                {selectedInfluencer.discountCodes && selectedInfluencer.discountCodes.length > 0 && (
                  <div>
                    <Text variant="headingMd" as="h3">
                      Discount Codes
                    </Text>
                    <div className="mt-3 space-y-3">
                      {selectedInfluencer.discountCodes.map((code) => (
                        <div key={code.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-mono font-bold">
                                {code.code}
                              </div>
                              <Badge tone={code.isActive ? 'success' : 'critical'}>
                                {code.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div title="Copy discount code">
                                <Button
                                  size="slim"
                                  onClick={() => copyToClipboard(code.code)}
                                  icon={<Copy className="w-4 h-4" />}
                                />
                              </div>
                              <div title="Copy discount link">
                                <Button
                                  size="slim"
                                  variant="secondary"
                                  onClick={() => copyToClipboard(code.uniqueLink || '')}
                                  icon={<Copy className="w-4 h-4" />}
                                />
                              </div>
                              <div title="Delete discount code">
                                <Button
                                  size="slim"
                                  variant="secondary"
                                  tone="critical"
                                  onClick={() => handleDeleteDiscountCode(code.id)}
                                  icon={<Trash className="w-4 h-4" />}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <Text variant="bodySm" tone="subdued" as="p">
                                Discount
                              </Text>
                              <Text variant="bodyMd" fontWeight="semibold" as="p">
                                {code.discountType === 'PERCENTAGE' 
                                  ? `${code.discountValue}% off` 
                                  : `$${code.discountValue} off`
                                }
                              </Text>
                            </div>
                            <div>
                              <Text variant="bodySm" tone="subdued" as="p">
                                Usage
                              </Text>
                              <Text variant="bodyMd" fontWeight="semibold" as="p">
                                {code.usageCount}/{code.usageLimit}
                              </Text>
                            </div>
                            <div>
                              <Text variant="bodySm" tone="subdued" as="p">
                                Link
                              </Text>
                              <div className="font-mono text-blue-600">
                                <Text variant="bodyMd" as="p">
                                  {code.uniqueLink ? code.uniqueLink.split('/').pop() : 'N/A'}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </BlockStack>
            )}
          </Modal.Section>
        </Modal>
      </Layout>
    </Page>
  );
} 