'use client';

import { Page, Layout, Card, Text, Button, BlockStack, DataTable, Badge, InlineStack, Modal, TextField, Select } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { Hash, Instagram, Eye, CheckCircle, Send, Filter, Youtube, Twitter, MessageCircle } from 'lucide-react';
import React from 'react';
import { UgcWorkflow } from '@/components/UgcWorkflow';
import { UgcAnalytics } from '@/components/UgcAnalytics';
import { LoadingButton } from '@/components/LoadingButton';
import { apiFetch } from '@/utils/api';

interface UgcPost {
  id: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER';
  postUrl: string;
  postId: string;
  content: string;
  mediaUrls: string[];
  engagement: number;
  isApproved: boolean;
  isRewarded: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  rewardAmount: number;
  influencerId: string;
  influencer?: {
    name: string;
    email: string;
    instagramHandle: string;
    tiktokHandle: string;
  } | null;
  discountCode?: {
    code: string;
    uniqueLink: string;
    usageCount: number;
    usageLimit: number;
  };
  createdAt: string;
}

export default function UgcPage() {
  const [posts, setPosts] = useState<UgcPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<UgcPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UgcPost | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [ugcSettings, setUgcSettings] = useState({
    autoApprove: false,
    minEngagement: 100,
    requiredHashtags: [''],
    excludedWords: [''],
    codeDelayHours: 2,
    codeDelayMinutes: 0,
    maxCodesPerDay: 50,
    maxCodesPerInfluencer: 1,
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 20,
    discountUsageLimit: 100,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchUgSettings();
  }, []);

  useEffect(() => {
    // Ensure posts is always an array
    if (!Array.isArray(posts)) {
      setFilteredPosts([]);
      return;
    }

    let filtered = posts.filter(post => {
      if (filter === 'all') return true;
      if (filter === 'pending') return !post.isApproved && !post.isRejected;
      if (filter === 'approved') return post.isApproved && !post.isRewarded;
      if (filter === 'rewarded') return post.isRewarded;
      if (filter === 'rejected') return post.isRejected;
      return true;
    });

    if (searchQuery.trim() === '') {
      setFilteredPosts(filtered);
    } else {
      const searchFiltered = filtered.filter(post =>
        (post.influencer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (post.influencer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        post.platform.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPosts(searchFiltered);
    }
  }, [searchQuery, filter, posts]);

  const fetchPosts = async () => {
    try {
      console.log('🔍 Fetching UGC posts with apiFetch utility...');
      const data = await apiFetch('/api/ugc-posts');
      
      if (data && Array.isArray(data)) {
        console.log('✅ UGC posts fetched successfully:', data.length, 'posts');
        setPosts(data);
      } else {
        console.error('❌ Failed to fetch UGC posts - invalid data format:', data);
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch UGC posts:', error);
      setPosts([]);
    } finally {
      console.log('🔍 Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleApprovePost = async (postId: string, options: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/ugc-posts/approve/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const errorData = await response.json();
        console.error('Failed to approve post:', errorData);
      }
    } catch (error) {
      console.error('Failed to approve post:', error);
    }
  };

  const handleRejectPost = async (postId: string, reason: string) => {
    try {
      const response = await fetch(`/api/ugc-posts/reject/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchPosts();
      } else {
        const errorData = await response.json();
        console.error('Failed to reject post:', errorData);
      }
    } catch (error) {
      console.error('Failed to reject post:', error);
    }
  };

  const handleSendDiscountCode = async (postId: string) => {
    try {
      const response = await fetch(`/api/ugc-posts/${postId}/send-code`, {
        method: 'POST',
      });

      if (response.ok) {
        setShowSendModal(false);
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to send discount code:', error);
    }
  };

  const getStatusBadge = (post: UgcPost) => {
    if (post.isRejected) {
      return <Badge tone="critical">Rejected</Badge>;
    }
    if (!post.isApproved) {
      return <Badge tone="attention">Pending Approval</Badge>;
    }
    if (post.isRewarded) {
      return <Badge tone="success">Rewarded</Badge>;
    }
    return <Badge tone="info">Approved</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return React.createElement(Instagram, { className: "w-4 h-4" });
      case 'TIKTOK':
        return React.createElement(Hash, { className: "w-4 h-4" });
      case 'YOUTUBE':
        return React.createElement(Youtube, { className: "w-4 h-4" });
      case 'TWITTER':
        return React.createElement(Twitter, { className: "w-4 h-4" });
      default:
        return React.createElement(MessageCircle, { className: "w-4 h-4" });
    }
  };

  const getEngagementLevel = (engagement: number) => {
    if (engagement >= 10000) return { level: 'High', color: 'success' };
    if (engagement >= 5000) return { level: 'Medium-High', color: 'success' };
    if (engagement >= 1000) return { level: 'Medium', color: 'warning' };
    if (engagement >= 500) return { level: 'Low-Medium', color: 'warning' };
    return { level: 'Low', color: 'attention' };
  };

  const fetchUgSettings = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        console.error('No merchant ID found');
        return;
      }

      const response = await apiFetch('/api/settings');
      if (response && response.ugcSettings) {
        setUgcSettings({
          autoApprove: response.ugcSettings.autoApprove || false,
          minEngagement: response.ugcSettings.minEngagement || 100,
          requiredHashtags: response.ugcSettings.requiredHashtags || [''],
          excludedWords: response.ugcSettings.excludedWords || [''],
          codeDelayHours: response.ugcSettings.codeDelayHours || 2,
          codeDelayMinutes: response.ugcSettings.codeDelayMinutes || 0,
          maxCodesPerDay: response.ugcSettings.maxCodesPerDay || 50,
          maxCodesPerInfluencer: response.ugcSettings.maxCodesPerInfluencer || 1,
          discountType: response.ugcSettings.discountType || 'PERCENTAGE',
          discountValue: response.ugcSettings.discountValue || 20,
          discountUsageLimit: response.ugcSettings.discountUsageLimit || 100,
        });
      }
    } catch (error) {
      console.error('Failed to fetch UGC settings:', error);
    }
  };

  const saveUgSettings = async () => {
    try {
      setIsSavingSettings(true);
      const merchantId = localStorage.getItem('merchantId');
      if (!merchantId) {
        console.error('No merchant ID found');
        return;
      }

      // Get current settings first
      const currentSettings = await apiFetch('/api/settings');
      
      const updatedSettings = {
        ...currentSettings,
        ugcSettings: {
          autoApprove: ugcSettings.autoApprove,
          minEngagement: ugcSettings.minEngagement,
          requiredHashtags: ugcSettings.requiredHashtags.filter(tag => tag.trim() !== ''),
          excludedWords: ugcSettings.excludedWords.filter(word => word.trim() !== ''),
          codeDelayHours: ugcSettings.codeDelayHours,
          codeDelayMinutes: ugcSettings.codeDelayMinutes,
          maxCodesPerDay: ugcSettings.maxCodesPerDay,
          maxCodesPerInfluencer: ugcSettings.maxCodesPerInfluencer,
          discountType: ugcSettings.discountType,
          discountValue: ugcSettings.discountValue,
          discountUsageLimit: ugcSettings.discountUsageLimit,
        }
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
        console.log('✅ UGC settings saved successfully');
        setShowSettingsModal(false);
      } else {
        console.error('Failed to save UGC settings');
      }
    } catch (error) {
      console.error('Error saving UGC settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <Page title="UGC Content">
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

  const pendingPosts = posts.filter(post => !post.isApproved && !post.isRejected);
  const approvedPosts = posts.filter(post => post.isApproved && !post.isRewarded);
  const rewardedPosts = posts.filter(post => post.isRewarded);
  const rejectedPosts = posts.filter(post => post.isRejected);

  return (
    <Page
      title="UGC Content"
      primaryAction={{
        content: 'Refresh',
        onAction: fetchPosts,
      }}
      secondaryActions={[
        {
          content: 'Workflow View',
          onAction: () => setShowWorkflow(!showWorkflow),
        },
        {
          content: 'Analytics',
          onAction: () => setShowAnalytics(!showAnalytics),
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
                <Text variant="headingLg" as="p" tone="critical">
                  {pendingPosts.length}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Pending Approval
                </Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="p" tone="success">
                  {approvedPosts.length}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Approved
                </Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="p" tone="success">
                  {rewardedPosts.length}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Rewarded
                </Text>
              </div>
            </Card>
            <Card>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Text variant="headingLg" as="p" tone="critical">
                  {rejectedPosts.length}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Rejected
                </Text>
              </div>
            </Card>
          </div>
        </Layout.Section>

        {/* Analytics View */}
        {showAnalytics && (
          <Layout.Section>
            <UgcAnalytics posts={posts} />
          </Layout.Section>
        )}

        {/* Workflow View */}
        {showWorkflow && pendingPosts.length > 0 && (
          <Layout.Section>
            <UgcWorkflow
              post={pendingPosts[0]}
              onApprove={handleApprovePost}
              onReject={handleRejectPost}
              onRefresh={fetchPosts}
            />
          </Layout.Section>
        )}

        {/* Main Content */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <div className="mb-6">
                <TextField
                  label="Search UGC posts"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by influencer name, email, or platform"
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
                    { label: 'All Posts', value: 'all' },
                    { label: 'Pending Approval', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rewarded', value: 'rewarded' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
                  value={filter}
                  onChange={setFilter}
                />
              </div>

              <div className="w-full">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Platform', 'Influencer', 'Status', 'Engagement', 'Date', 'Actions']}
                  rows={filteredPosts.map((post) => [
                    <div key={post.id} className="flex items-center space-x-2">
                      {getPlatformIcon(post.platform)}
                      <span>{post.platform}</span>
                    </div>,
                    <div key={post.id}>
                      <div className="font-semibold">{post.influencer?.name || 'Unknown Influencer'}</div>
                      <div className="text-sm text-gray-500">{post.influencer?.email || 'No email'}</div>
                    </div>,
                    getStatusBadge(post),
                    <div key={post.id}>
                      <div>{post.engagement.toLocaleString()} engagements</div>
                      <Badge tone={getEngagementLevel(post.engagement).color as 'success' | 'warning' | 'attention' | 'info'}>
                        {getEngagementLevel(post.engagement).level}
                      </Badge>
                    </div>,
                    new Date(post.createdAt).toLocaleDateString(),
                    <InlineStack key={post.id} gap="200">
                      <div title="View post details and content">
                        <Button
                          size="slim"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowDetailsModal(true);
                          }}
                          icon={() => React.createElement(Eye, { className: "w-4 h-4" })}
                        >
                          Details
                        </Button>
                      </div>
                      {!post.isApproved && !post.isRejected && (
                        <div title="Approve this UGC post">
                          <LoadingButton
                            size="slim"
                            variant="secondary"
                            onClick={() => handleApprovePost(post.id, { autoReward: true })}
                            icon={() => React.createElement(CheckCircle, { className: "w-4 h-4" })}
                            loadingText="Approving..."
                          >
                            Approve
                          </LoadingButton>
                        </div>
                      )}
                      {post.isApproved && !post.isRewarded && (
                        <div title="Send discount code via social media DM">
                          <LoadingButton
                            size="slim"
                            variant="secondary"
                            onClick={() => {
                              setSelectedPost(post);
                              setShowSendModal(true);
                            }}
                            icon={() => React.createElement(Send, { className: "w-4 h-4" })}
                            loadingText="Sending..."
                          >
                            Send DM
                          </LoadingButton>
                        </div>
                      )}
                    </InlineStack>
                  ])}
                />
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-8">
                  <Text variant="bodyMd" tone="subdued" as="p">
                    No UGC posts found. Posts will appear here when influencers tag your brand.
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Send Discount Code Modal */}
        <Modal
          open={showSendModal}
          onClose={() => setShowSendModal(false)}
          title={`Send Discount Code via ${selectedPost?.platform} DM`}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd" as="p">
                This will automatically send a unique discount code to {selectedPost?.influencer?.name || 'Unknown Influencer'} 
                via {selectedPost?.platform} direct message for their UGC post. The code will be valid for one-time use.
              </Text>
              
              {selectedPost && (
                <div className="bg-gray-50 p-4 rounded">
                  <Text variant="bodyMd" as="p" fontWeight="bold">
                    Post Details:
                  </Text>
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(selectedPost.platform)}
                    <Text variant="bodySm" as="p">
                      Platform: {selectedPost.platform}
                    </Text>
                  </div>
                  <Text variant="bodySm" as="p">
                    Engagement: {selectedPost.engagement}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Posted: {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Influencer: {selectedPost.influencer?.name || 'Unknown Influencer'}
                  </Text>
                  {selectedPost.platform === 'INSTAGRAM' && selectedPost.influencer?.instagramHandle && (
                    <Text variant="bodySm" as="p">
                      Instagram: @{selectedPost.influencer.instagramHandle}
                    </Text>
                  )}
                  {selectedPost.platform === 'TIKTOK' && selectedPost.influencer?.tiktokHandle && (
                    <Text variant="bodySm" as="p">
                      TikTok: @{selectedPost.influencer.tiktokHandle}
                    </Text>
                  )}
                </div>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>

        {/* Details Modal */}
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedPost?.influencer?.name || 'Unknown Influencer'} - UGC Details`}
          primaryAction={{
            content: 'Close',
            onAction: () => setShowDetailsModal(false),
          }}
        >
          <Modal.Section>
            {selectedPost && (
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3">
                    Post Information
                  </Text>
                  <div className="mt-3 space-y-2">
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Platform
                      </Text>
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(selectedPost.platform)}
                        <Text variant="bodyMd" as="p">
                          {selectedPost.platform}
                        </Text>
                      </div>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Status
                      </Text>
                      {getStatusBadge(selectedPost)}
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Engagement
                      </Text>
                      <div className="flex items-center space-x-2">
                        <Text variant="bodyMd" as="p">
                          {selectedPost.engagement.toLocaleString()} engagements
                        </Text>
                        <Badge tone={getEngagementLevel(selectedPost.engagement).color as 'success' | 'warning' | 'attention' | 'info'}>
                          {getEngagementLevel(selectedPost.engagement).level}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Posted Date
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {new Date(selectedPost.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Post URL
                      </Text>
                      <Button
                        size="slim"
                        variant="secondary"
                        onClick={() => window.open(selectedPost.postUrl, '_blank')}
                      >
                        View Original Post
                      </Button>
                    </div>
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
                        {selectedPost.influencer?.name || 'Unknown Influencer'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Email
                      </Text>
                      <Text variant="bodyMd" as="p">
                        {selectedPost.influencer?.email || 'No email'}
                      </Text>
                    </div>
                    {selectedPost.influencer?.instagramHandle && (
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Instagram
                        </Text>
                        <Text variant="bodyMd" as="p">
                          @{selectedPost.influencer.instagramHandle}
                        </Text>
                      </div>
                    )}
                    {selectedPost.influencer?.tiktokHandle && (
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          TikTok
                        </Text>
                        <Text variant="bodyMd" as="p">
                          @{selectedPost.influencer.tiktokHandle}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Text variant="headingMd" as="h3">
                    Content
                  </Text>
                  <div className="mt-3">
                    <Text variant="bodyMd" as="p">
                      {selectedPost.content}
                    </Text>
                  </div>
                </div>

                {selectedPost.discountCode && (
                  <div>
                    <Text variant="headingMd" as="h3">
                      Discount Code
                    </Text>
                    <div className="mt-3 space-y-2">
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Code
                        </Text>
                        <Text variant="bodyMd" fontWeight="semibold" as="p">
                          {selectedPost.discountCode.code}
                        </Text>
                      </div>
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Usage
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {selectedPost.discountCode.usageCount}/{selectedPost.discountCode.usageLimit} times used
                        </Text>
                      </div>
                      <div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Link
                        </Text>
                        <div className="font-mono text-blue-600">
                          <Text variant="bodyMd" as="p">
                            {selectedPost.discountCode.uniqueLink}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                  <div>
                    <Text variant="headingMd" as="h3">
                      Media ({selectedPost.mediaUrls.length} files)
                    </Text>
                    <div className="mt-3 space-y-2">
                      {selectedPost.mediaUrls.map((url, index) => (
                        <div key={index}>
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => window.open(url, '_blank')}
                          >
                            {`View Media ${index + 1}`}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </BlockStack>
            )}
          </Modal.Section>
          <Modal.Section>
            <InlineStack gap="200" align="end">
              <Button
                variant="secondary"
                onClick={() => setShowSendModal(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                variant="primary"
                onClick={() => {
                  if (selectedPost) {
                    handleSendDiscountCode(selectedPost.id);
                  }
                }}
                loadingText="Sending via DM..."
              >
                Send via DM
              </LoadingButton>
            </InlineStack>
          </Modal.Section>
        </Modal>

        {/* UGC Settings Modal */}
        <Modal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="UGC Settings"
        >
          <Modal.Section>
            <BlockStack gap="400">
              {/* UGC Settings Section */}
              <div>
                <Text variant="headingMd" as="h3">
                  UGC Settings
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <TextField
                    label="Minimum Engagement"
                    type="number"
                    value={String(ugcSettings.minEngagement)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      minEngagement: parseInt(value) || 0
                    })}
                    min="0"
                    autoComplete="off"
                  />
                  <Select
                    label="Auto-Approve Posts"
                    options={[
                      { label: 'Yes', value: 'true' },
                      { label: 'No', value: 'false' },
                    ]}
                    value={ugcSettings.autoApprove ? 'true' : 'false'}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      autoApprove: value === 'true'
                    })}
                  />
                </div>
              </div>

              {/* UGC Discount Code Settings Section */}
              <div>
                <Text variant="headingMd" as="h3">
                  UGC Discount Code Settings
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Select
                    label="Discount Type"
                    options={[
                      { label: 'Percentage Discount', value: 'PERCENTAGE' },
                      { label: 'Fixed Amount', value: 'FIXED_AMOUNT' },
                    ]}
                    value={ugcSettings.discountType}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      discountType: value as 'PERCENTAGE' | 'FIXED_AMOUNT'
                    })}
                  />
                  <TextField
                    label={ugcSettings.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
                    type="number"
                    value={String(ugcSettings.discountValue)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      discountValue: parseFloat(value) || 0
                    })}
                    min="0"
                    max={ugcSettings.discountType === 'PERCENTAGE' ? "100" : undefined}
                    autoComplete="off"
                  />
                  <TextField
                    label="Usage Limit"
                    type="number"
                    value={String(ugcSettings.discountUsageLimit)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      discountUsageLimit: parseInt(value) || 0
                    })}
                    min="0"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    {ugcSettings.discountValue}{ugcSettings.discountType === 'PERCENTAGE' ? '%' : '$'} discount codes will be sent to UGC creators. Each code can be used up to {ugcSettings.discountUsageLimit} times.
                  </Text>
                </div>
              </div>

              {/* Code Delivery Timer Settings Section */}
              <div>
                <Text variant="headingMd" as="h3">
                  Code Delivery Timer Settings
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <TextField
                    label="Delay Hours"
                    type="number"
                    value={String(ugcSettings.codeDelayHours)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      codeDelayHours: parseInt(value) || 0
                    })}
                    min="0"
                    max="24"
                    autoComplete="off"
                  />
                  <TextField
                    label="Delay Minutes"
                    type="number"
                    value={String(ugcSettings.codeDelayMinutes)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      codeDelayMinutes: parseInt(value) || 0
                    })}
                    min="0"
                    max="59"
                    autoComplete="off"
                  />
                  <TextField
                    label="Max Codes Per Day"
                    type="number"
                    value={String(ugcSettings.maxCodesPerDay)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      maxCodesPerDay: parseInt(value) || 0
                    })}
                    min="0"
                    autoComplete="off"
                  />
                  <TextField
                    label="Max Codes Per Influencer (24h)"
                    type="number"
                    value={String(ugcSettings.maxCodesPerInfluencer)}
                    onChange={(value) => setUgcSettings({
                      ...ugcSettings,
                      maxCodesPerInfluencer: parseInt(value) || 0
                    })}
                    min="0"
                    autoComplete="off"
                  />
                </div>
                <div className="mt-2">
                  <Text variant="bodySm" tone="subdued" as="p">
                    Code will be sent {ugcSettings.codeDelayHours}h {ugcSettings.codeDelayMinutes}m after post approval. Maximum {ugcSettings.maxCodesPerDay} codes per day, {ugcSettings.maxCodesPerInfluencer} per influencer in 24 hours.
                  </Text>
                </div>
              </div>

              {/* Required Hashtags Section */}
              <div>
                <Text variant="headingMd" as="h3">
                  Required Hashtags
                </Text>
                <div className="mt-3 space-y-2">
                  {ugcSettings.requiredHashtags.map((hashtag, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <TextField
                        label={`Hashtag ${index + 1}`}
                        value={hashtag}
                        onChange={(value) => {
                          const newHashtags = [...ugcSettings.requiredHashtags];
                          newHashtags[index] = value;
                          setUgcSettings({
                            ...ugcSettings,
                            requiredHashtags: newHashtags
                          });
                        }}
                        placeholder="#yourbrand"
                        autoComplete="off"
                      />
                      {ugcSettings.requiredHashtags.length > 1 && (
                        <Button
                          size="slim"
                          variant="secondary"
                          onClick={() => {
                            const newHashtags = ugcSettings.requiredHashtags.filter((_, i) => i !== index);
                            setUgcSettings({
                              ...ugcSettings,
                              requiredHashtags: newHashtags
                            });
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="slim"
                    variant="secondary"
                    onClick={() => setUgcSettings({
                      ...ugcSettings,
                      requiredHashtags: [...ugcSettings.requiredHashtags, '']
                    })}
                  >
                    Add Hashtag
                  </Button>
                </div>
              </div>

              {/* Excluded Words Section */}
              <div>
                <Text variant="headingMd" as="h3">
                  Excluded Words
                </Text>
                <div className="mt-3 space-y-2">
                  {ugcSettings.excludedWords.map((word, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <TextField
                        label={`Excluded Word ${index + 1}`}
                        value={word}
                        onChange={(value) => {
                          const newWords = [...ugcSettings.excludedWords];
                          newWords[index] = value;
                          setUgcSettings({
                            ...ugcSettings,
                            excludedWords: newWords
                          });
                        }}
                        placeholder="spam"
                        autoComplete="off"
                      />
                      {ugcSettings.excludedWords.length > 1 && (
                        <Button
                          size="slim"
                          variant="secondary"
                          onClick={() => {
                            const newWords = ugcSettings.excludedWords.filter((_, i) => i !== index);
                            setUgcSettings({
                              ...ugcSettings,
                              excludedWords: newWords
                            });
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="slim"
                    variant="secondary"
                    onClick={() => setUgcSettings({
                      ...ugcSettings,
                      excludedWords: [...ugcSettings.excludedWords, '']
                    })}
                  >
                    Add Excluded Word
                  </Button>
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
                onClick={saveUgSettings}
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