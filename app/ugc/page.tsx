'use client';

import { Page, Layout, Card, Text, Button, BlockStack, DataTable, Badge, InlineStack, Modal, TextField, Select } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { Hash, Instagram, Eye, CheckCircle, Send, Filter, Youtube, Twitter, MessageCircle } from 'lucide-react';
import React from 'react';
import { UgcWorkflow } from '@/components/UgcWorkflow';
import { UgcAnalytics } from '@/components/UgcAnalytics';

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

  useEffect(() => {
    fetchPosts();
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
      const response = await fetch('/api/ugc-posts');
      const result = await response.json();
      
      // Handle the API response format
      if (result.success && Array.isArray(result.data)) {
        setPosts(result.data);
      } else if (Array.isArray(result)) {
        // Fallback for direct array response
        setPosts(result);
      } else {
        console.error('Invalid response format:', result);
        setPosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch UGC posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePost = async (postId: string, options: any) => {
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
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => handleApprovePost(post.id, { autoReward: true })}
                            icon={() => React.createElement(CheckCircle, { className: "w-4 h-4" })}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                      {post.isApproved && !post.isRewarded && (
                        <div title="Send discount code via social media DM">
                          <Button
                            size="slim"
                            variant="secondary"
                            onClick={() => {
                              setSelectedPost(post);
                              setShowSendModal(true);
                            }}
                            icon={() => React.createElement(Send, { className: "w-4 h-4" })}
                          >
                            Send DM
                          </Button>
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
          primaryAction={{
            content: 'Send via DM',
            onAction: () => selectedPost && handleSendDiscountCode(selectedPost.id),
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowSendModal(false),
            },
          ]}
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
        </Modal>
      </Layout>
    </Page>
  );
} 