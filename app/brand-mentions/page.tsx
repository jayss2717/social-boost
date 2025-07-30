'use client';

import { Page, Layout, Card, Text, Button, BlockStack, Badge, Banner, InlineStack, Modal, TextField, Select, Pagination, DataTable } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { Hash, Instagram, Eye, Youtube, Twitter, Users, TrendingUp, Gift } from 'lucide-react';

interface BrandMention {
  id: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER';
  username: string;
  displayName: string;
  profilePictureUrl: string;
  postId: string;
  postUrl: string;
  content: string;
  mediaUrls: string[];
  engagement: number;
  isInfluencer: boolean;
  isProcessed: boolean;
  dmSent: boolean;
  dmSentAt: string;
  createdAt: string;
  socialMediaAccount: {
    username: string;
    displayName: string;
  };
  discountCodes: Array<{
    code: string;
    usageCount: number;
    usageLimit: number;
  }>;
}

interface BrandMentionsData {
  mentions: BrandMention[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    byPlatform: any;
    byType: {
      influencers: number;
      randomPeople: number;
    };
    byStatus: {
      processed: number;
      unprocessed: number;
    };
  };
}

export default function BrandMentionsPage() {
  const [mentions, setMentions] = useState<BrandMentionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    platform: '',
    status: '',
    page: 1,
  });
  const [selectedMention, setSelectedMention] = useState<BrandMention | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchBrandMentions();
  }, [filters]);

  const fetchBrandMentions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        ...(filters.platform && { platform: filters.platform }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/brand-mentions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMentions(data);
      } else {
        setError('Failed to fetch brand mentions');
      }
    } catch (error) {
      console.error('Error fetching brand mentions:', error);
      setError('Failed to fetch brand mentions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'TIKTOK':
        return <Hash className="w-4 h-4 text-black" />;
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'TWITTER':
        return <Twitter className="w-4 h-4 text-blue-400" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (mention: BrandMention) => {
    if (mention.isInfluencer) {
      return <Badge tone="info">Influencer</Badge>;
    } else if (mention.dmSent) {
      return <Badge tone="success">Rewarded</Badge>;
    } else if (mention.isProcessed) {
      return <Badge tone="warning">Processed</Badge>;
    } else {
      return <Badge tone="attention">New</Badge>;
    }
  };

  const handleViewDetail = (mention: BrandMention) => {
    setSelectedMention(mention);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <Page title="Brand Mentions">
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
      <Page title="Brand Mentions">
        <Layout>
          <Layout.Section>
            <Card>
              <div className="p-6 text-center">
                <Banner tone="critical">
                  <Text variant="headingLg" as="h2">
                    Error Loading Brand Mentions
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    {error}
                  </Text>
                  <div className="mt-4">
                    <Button variant="primary" onClick={fetchBrandMentions}>
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

  const metricCards = [
    {
      title: 'Total Mentions',
      value: mentions?.summary.total || 0,
      icon: Hash,
      color: 'success',
    },
    {
      title: 'Influencers',
      value: mentions?.summary.byType.influencers || 0,
      icon: Users,
      color: 'info',
    },
    {
      title: 'Random People',
      value: mentions?.summary.byType.randomPeople || 0,
      icon: TrendingUp,
      color: 'success',
    },
    {
      title: 'Rewards Sent',
      value: mentions?.summary.byStatus.processed || 0,
      icon: Gift,
      color: 'warning',
    },
  ];

  const rows = mentions?.mentions.map(mention => [
    `${mention.platform} @${mention.username}`,
    mention.engagement.toString(),
    mention.isProcessed ? 'Processed' : 'Unprocessed',
    new Date(mention.createdAt).toLocaleDateString(),
    // Use a simple button label for actions
    'View',
  ]) || [];

  return (
    <Page title="Brand Mentions">
      <Layout>
        {/* Summary Cards */}
        <Layout.Section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metricCards.map((card, index) => (
              <Card key={index}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="headingMd" as="h3">
                        {card.value}
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        {card.title}
                      </Text>
                    </div>
                    <card.icon className={`w-8 h-8 text-${card.color}-600`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Layout.Section>

        {/* Filters */}
        <Layout.Section>
          <Card>
            <div className="p-4">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  Filters
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Platform"
                    options={[
                      { label: 'All Platforms', value: '' },
                      { label: 'Instagram', value: 'INSTAGRAM' },
                      { label: 'TikTok', value: 'TIKTOK' },
                      { label: 'YouTube', value: 'YOUTUBE' },
                      { label: 'Twitter', value: 'TWITTER' },
                    ]}
                    value={filters.platform}
                    onChange={(value) => handleFilterChange('platform', value)}
                  />
                  <Select
                    label="Status"
                    options={[
                      { label: 'All Status', value: '' },
                      { label: 'New', value: 'unprocessed' },
                      { label: 'Processed', value: 'processed' },
                    ]}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFilters({
                          platform: '',
                          status: '',
                          page: 1,
                        });
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Mentions Table */}
        <Layout.Section>
          <Card>
            <div className="p-4">
              <BlockStack gap="400">
                <div className="flex justify-between items-center">
                  <Text variant="headingMd" as="h3">
                    Brand Mentions
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {mentions?.pagination.total || 0} total mentions
                  </Text>
                </div>

                {mentions?.mentions.length === 0 ? (
                  <div className="text-center py-8">
                    <Hash className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <Text variant="headingMd" as="h3">
                      No brand mentions found
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      When people tag your brand on social media, they&apos;ll appear here.
                    </Text>
                  </div>
                ) : (
                  <>
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'text', 'text', 'text']}
                      headings={['User', 'Engagement', 'Status', 'Date', 'Actions']}
                      rows={rows}
                    />
                    
                    {(mentions?.pagination?.pages ?? 1) > 1 && (
                      <div className="flex justify-center mt-4">
                        <Pagination
                          hasPrevious={(mentions?.pagination?.page ?? 1) > 1}
                          onPrevious={() => handlePageChange((mentions?.pagination?.page ?? 1) - 1)}
                          hasNext={(mentions?.pagination?.page ?? 1) < (mentions?.pagination?.pages ?? 1)}
                          onNext={() => handlePageChange((mentions?.pagination?.page ?? 1) + 1)}
                        />
                      </div>
                    )}
                  </>
                )}
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Detail Modal */}
      {selectedMention && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Brand Mention Details"
          primaryAction={{
            content: 'Close',
            onAction: () => setShowDetailModal(false),
          }}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="p">
                    User
                  </Text>
                  <Text variant="bodyMd" as="p">
                    @{selectedMention.username}
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="p">
                    Platform
                  </Text>
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(selectedMention.platform)}
                    <Text variant="bodyMd" as="span">
                      {selectedMention.platform}
                    </Text>
                  </div>
                </div>
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="p">
                    Engagement
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {selectedMention.engagement} likes/comments
                  </Text>
                </div>
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="p">
                    Status
                  </Text>
                  {getStatusBadge(selectedMention)}
                </div>
              </div>

              {selectedMention.content && (
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="p">
                    Content
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {selectedMention.content}
                  </Text>
                </div>
              )}

              {selectedMention.discountCodes.length > 0 && (
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="p">
                    Discount Codes Sent
                  </Text>
                  {selectedMention.discountCodes.map((code, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Text variant="bodyMd" as="span">
                        {code.code}
                      </Text>
                      <Badge tone="info">
                        {`${code.usageCount}/${code.usageLimit} used`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  onClick={() => window.open(selectedMention.postUrl, '_blank')}
                >
                  View Original Post
                </Button>
                {!selectedMention.isInfluencer && !selectedMention.dmSent && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // TODO: Implement manual DM sending
                      console.log('Send DM to', selectedMention.username);
                    }}
                  >
                    Send Reward DM
                  </Button>
                )}
              </div>
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
} 