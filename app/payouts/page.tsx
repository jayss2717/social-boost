'use client';

import { Page, Layout, Card, Text, Button, BlockStack, DataTable, Badge, Banner, InlineStack, Modal, TextField, Select } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, Send, Filter, Download, Eye } from 'lucide-react';

interface Payout {
  id: string;
  influencerId: string;
  influencer: {
    name: string;
    email: string;
  };
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  commissionRate: number;
  salesAmount: number;
  createdAt: string;
  processedAt?: string;
  stripeTransferId?: string;
}

interface PayoutSummary {
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  totalPayouts: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayouts();
    fetchSummary();
  }, []);

  useEffect(() => {
    let filtered = payouts.filter(payout => {
      if (filter === 'all') return true;
      if (filter === 'pending') return payout.status === 'PENDING';
      if (filter === 'processing') return payout.status === 'PROCESSING';
      if (filter === 'completed') return payout.status === 'COMPLETED';
      if (filter === 'failed') return payout.status === 'FAILED';
      return true;
    });

    if (searchQuery.trim() === '') {
      setFilteredPayouts(filtered);
    } else {
      const searchFiltered = filtered.filter(payout =>
        payout.influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payout.influencer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payout.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPayouts(searchFiltered);
    }
  }, [searchQuery, filter, payouts]);

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/payouts', {
        headers: {
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        }
      });
      const result = await response.json();
      
      // Handle the API response format
      if (result.success && Array.isArray(result.data)) {
        setPayouts(result.data);
      } else if (Array.isArray(result)) {
        setPayouts(result);
      } else {
        console.error('Invalid response format:', result);
        setPayouts([]);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      setPayouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/payouts/summary', {
        headers: {
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch payout summary:', response.status, response.statusText);
        setSummary(null);
        return;
      }
      
      const result = await response.json();
      
      // Handle the API response format
      if (result.success && result.data) {
        setSummary(result.data);
      } else if (result.success && result.data === null) {
        setSummary(null);
      } else {
        console.error('Invalid response format:', result);
        setSummary(null);
      }
    } catch (error) {
      console.error('Failed to fetch payout summary:', error);
      setSummary(null);
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: {
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        }
      });

      if (response.ok) {
        setShowProcessModal(false);
        fetchPayouts();
        fetchSummary();
      }
    } catch (error) {
      console.error('Failed to process payout:', error);
    }
  };

  const handleBulkProcess = async () => {
    try {
      const response = await fetch('/api/payouts/bulk-process', {
        method: 'POST',
        headers: {
          'x-merchant-id': 'cmdooccbt0003vg1wgp7c1mcd'
        }
      });

      if (response.ok) {
        fetchPayouts();
        fetchSummary();
      }
    } catch (error) {
      console.error('Failed to process bulk payouts:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge tone="attention">Pending</Badge>;
      case 'PROCESSING':
        return <Badge tone="info">Processing</Badge>;
      case 'COMPLETED':
        return <Badge tone="success">Completed</Badge>;
      case 'FAILED':
        return <Badge tone="critical">Failed</Badge>;
      default:
        return <Badge tone="warning">Unknown</Badge>;
    }
  };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'PENDING':
  //       return <Clock className="w-4 h-4" />;
  //     case 'PROCESSING':
  //       return <AlertCircle className="w-4 h-4" />;
  //     case 'COMPLETED':
  //       return <CheckCircle className="w-4 h-4" />;
  //     case 'FAILED':
  //       return <AlertCircle className="w-4 h-4" />;
  //     default:
  //       return <Clock className="w-4 h-4" />;
  //   }
  // };

  const pendingPayouts = Array.isArray(payouts) ? payouts.filter(p => p.status === 'PENDING') : [];

  if (isLoading) {
    return (
      <Page title="Payouts">
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

  return (
    <Page
      title="Payouts"
      primaryAction={{
        content: 'Process All Pending',
        icon: () => <Send size={20} />,
        onAction: handleBulkProcess,
        disabled: pendingPayouts.length === 0,
      }}
    >
      <Layout>
        {/* Summary Cards */}
        {summary ? (
          <Layout.Section>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Total Payouts
                      </Text>
                      <Text variant="headingLg" as="h3">
                        ${summary?.totalAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Pending
                      </Text>
                      <Text variant="headingLg" as="h3">
                        ${summary?.pendingAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Completed
                      </Text>
                      <Text variant="headingLg" as="h3">
                        ${summary?.completedAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Payouts Count
                      </Text>
                      <Text variant="headingLg" as="h3">
                        {summary?.totalPayouts || 0}
                      </Text>
                    </div>
                    <CreditCard className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>
          </Layout.Section>
        ) : (
          <Layout.Section>
            <Card>
              <div className="p-4">
                <Banner tone="warning">
                  <p>Unable to load payout summary. Please check your authentication and try again.</p>
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Payouts Table */}
        <Layout.Section>
          <Card>
            <div className="p-6 w-full">
              <div className="mb-6">
                <TextField
                  label="Search payouts"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by influencer name, email, or status"
                  prefix={<Filter className="w-4 h-4" />}
                  clearButton
                  onClearButtonClick={() => setSearchQuery('')}
                  autoComplete="off"
                />
              </div>
              
              <div className="mb-4">
                <Select
                  label="Filter"
                  labelInline
                  options={[
                    { label: 'All Payouts', value: 'all' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Processing', value: 'processing' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Failed', value: 'failed' },
                  ]}
                  value={filter}
                  onChange={setFilter}
                />
              </div>

              <div className="w-full">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Influencer', 'Amount', 'Status', 'Commission', 'Date', 'Actions']}
                  rows={filteredPayouts.map((payout) => [
                    <div key={payout.id}>
                      <div className="font-semibold">{payout.influencer.name}</div>
                      <div className="text-sm text-gray-500">{payout.influencer.email}</div>
                    </div>,
                    <div key={payout.id} className="font-semibold">
                      ${payout.amount?.toFixed(2) || '0.00'}
                    </div>,
                    getStatusBadge(payout.status),
                    `${((payout.commissionRate || 0) * 100).toFixed(1)}%`,
                    new Date(payout.createdAt).toLocaleDateString(),
                    <InlineStack key={payout.id} gap="200">
                      <div title="View payout details">
                        <Button
                          size="slim"
                          onClick={() => {
                            setSelectedPayout(payout);
                            setShowDetailsModal(true);
                          }}
                          icon={<Eye className="w-4 h-4" />}
                        >
                          Details
                        </Button>
                      </div>
                      {payout.status === 'PENDING' && (
                        <div title="Process this payout">
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowProcessModal(true);
                            }}
                            icon={<Send className="w-4 h-4" />}
                          >
                            Process
                          </Button>
                        </div>
                      )}
                      {payout.status === 'COMPLETED' && (
                        <div title="Download receipt">
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => window.open(`/api/payouts/${payout.id}/download`, '_blank')}
                            icon={<Download className="w-4 h-4" />}
                          >
                            Receipt
                          </Button>
                        </div>
                      )}
                    </InlineStack>
                  ])}
                />
              </div>

              {filteredPayouts.length === 0 && (
                <div className="text-center py-8">
                  <Text variant="bodyMd" tone="subdued" as="p">
                    No payouts found matching the current filter.
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Process Payout Modal */}
        <Modal
          open={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          title={`Process Payout for ${selectedPayout?.influencer.name}`}
          primaryAction={{
            content: 'Process Payout',
            onAction: () => selectedPayout && handleProcessPayout(selectedPayout.id),
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowProcessModal(false),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd" as="p">
                This will process the payout of ${selectedPayout?.amount?.toFixed(2) || '0.00'} to {selectedPayout?.influencer?.name || 'Unknown Influencer'} 
                via Stripe Connect.
              </Text>
              
              {selectedPayout && (
                <div className="bg-gray-50 p-4 rounded">
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Payout Details:
                  </Text>
                  <Text variant="bodySm" as="p">
                    Amount: ${selectedPayout.amount?.toFixed(2) || '0.00'}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Commission Rate: {((selectedPayout.commissionRate || 0) * 100).toFixed(1)}%
                  </Text>
                  <Text variant="bodySm" as="p">
                    Sales Amount: ${selectedPayout.salesAmount?.toFixed(2) || '0.00'}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Created: {new Date(selectedPayout.createdAt).toLocaleDateString()}
                  </Text>
                </div>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>

        {/* Details Modal */}
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedPayout?.influencer.name} - Payout Details`}
          primaryAction={{
            content: 'Close',
            onAction: () => setShowDetailsModal(false),
          }}
        >
          <Modal.Section>
            {selectedPayout && (
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3">
                    Payout Information
                  </Text>
                  <div className="mt-3 space-y-2">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Status
                      </Text>
                      {getStatusBadge(selectedPayout.status)}
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Amount
                      </Text>
                      <Text variant="bodyMd" as="p">
                        ${selectedPayout.amount?.toFixed(2) || '0.00'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Commission Rate
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {((selectedPayout.commissionRate || 0) * 100).toFixed(1)}%
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Sales Amount
                      </Text>
                      <Text variant="bodyMd" as="p">
                        ${selectedPayout.salesAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Created Date
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {new Date(selectedPayout.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                    {selectedPayout.processedAt && (
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Processed Date
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {new Date(selectedPayout.processedAt).toLocaleDateString()}
                        </Text>
                      </div>
                    )}
                    {selectedPayout.stripeTransferId && (
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Stripe Transfer ID
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {selectedPayout.stripeTransferId}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="headingMd" as="h3">
                    Influencer Information
                  </Text>
                  <div className="mt-3 space-y-2">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Name
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedPayout.influencer?.name || 'Unknown Influencer'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Email
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedPayout.influencer?.email || 'No email'}
                      </Text>
                    </div>
                  </div>
                </div>

                {selectedPayout.status === 'PENDING' && (
                  <div>
                    <Text variant="headingMd" as="h3">
                      Actions
                    </Text>
                    <div className="mt-3">
                      <InlineStack gap="200">
                        <Button
                          onClick={() => {
                            setShowDetailsModal(false);
                            setSelectedPayout(selectedPayout);
                            setShowProcessModal(true);
                          }}
                          icon={<Send className="w-4 h-4" />}
                        >
                          Process Payout
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => window.open(`/api/payouts/${selectedPayout.id}/download`, '_blank')}
                          icon={<Download className="w-4 h-4" />}
                        >
                          Download Receipt
                        </Button>
                      </InlineStack>
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