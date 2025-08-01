'use client';

import { Card, Text, Badge, Button, Modal, TextField, Select, Banner } from '@shopify/polaris';
import { useState } from 'react';
import { CheckCircle, XCircle, Gift, TrendingUp } from 'lucide-react';

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

interface UgcWorkflowProps {
  post: UgcPost;
  onApprove: (postId: string, options: Record<string, unknown>) => Promise<void>;
  onReject: (postId: string, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export function UgcWorkflow({ post, onApprove, onReject, onRefresh }: UgcWorkflowProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalOptions, setApprovalOptions] = useState({
    autoReward: true,
    rewardAmount: 0,
    rewardType: 'PERCENTAGE'
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const getEngagementLevel = (engagement: number) => {
    if (engagement >= 10000) return { level: 'High', color: 'success', icon: TrendingUp };
    if (engagement >= 5000) return { level: 'Medium-High', color: 'success', icon: TrendingUp };
    if (engagement >= 1000) return { level: 'Medium', color: 'warning', icon: TrendingUp };
    if (engagement >= 500) return { level: 'Low-Medium', color: 'warning', icon: TrendingUp };
    return { level: 'Low', color: 'attention', icon: TrendingUp };
  };

  const getSuggestedReward = (engagement: number) => {
    if (engagement >= 10000) return 50;
    if (engagement >= 5000) return 30;
    if (engagement >= 1000) return 20;
    if (engagement >= 500) return 15;
    return 10;
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(post.id as string, approvalOptions);
      setShowApprovalModal(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to approve post:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(post.id as string, rejectionReason);
      setShowRejectionModal(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to reject post:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const engagementInfo = getEngagementLevel(post.engagement as number);
  const suggestedReward = getSuggestedReward(post.engagement as number);

  return (
    <div>
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Header with status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text variant="headingMd" as="h3">
                  UGC Approval Workflow
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Review and approve user-generated content
                </Text>
              </div>
              <Badge tone={(post.isApproved as boolean) ? 'success' : 'critical'}>
                {(post.isApproved as boolean) ? 'Approved' : 'Pending Approval'}
              </Badge>
            </div>

            {/* Content preview */}
            <div style={{ backgroundColor: '#f6f6f7', padding: '1rem', borderRadius: '8px' }}>
              <Text variant="bodyMd" as="p">
                &quot;{post.content}&quot;
              </Text>
              <div style={{ marginTop: '0.5rem' }}>
                <Button size="slim" variant="secondary" onClick={() => window.open(post.postUrl, '_blank')}>
                  View Original Post
                </Button>
              </div>
            </div>

            {/* Engagement metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text variant="bodyMd" as="p" fontWeight="bold">
                  Engagement Analysis
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp className="w-4 h-4" />
                  <Text variant="bodySm" as="p">
                    {post.engagement.toLocaleString()} engagements
                  </Text>
                  <Badge tone="success">
                    {`${engagementInfo.level} Level`}
                  </Badge>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text variant="bodySm" tone="subdued" as="p">
                  Suggested Reward
                </Text>
                <Text variant="headingMd" as="p" fontWeight="bold">
                  ${suggestedReward}
                </Text>
              </div>
            </div>

            {/* Influencer info */}
            <div style={{ backgroundColor: '#f6f6f7', padding: '1rem', borderRadius: '8px' }}>
              <Text variant="bodyMd" as="p" fontWeight="bold">
                Influencer Details
              </Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div>
                  <Text variant="bodySm" as="p">
                    {post.influencer?.name || 'Unknown Influencer'}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {post.influencer?.email || 'No email'}
                  </Text>
                </div>
                <div>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Platform: {post.platform}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Posted: {new Date(post.createdAt).toLocaleDateString()}
                  </Text>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {!post.isApproved && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button
                  variant="primary"
                  onClick={() => setShowApprovalModal(true)}
                  icon={CheckCircle}
                >
                  Approve & Reward
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowApprovalModal(true)}
                  icon={CheckCircle}
                >
                  Approve Only
                </Button>
                <Button
                  variant="secondary"
                  tone="critical"
                  onClick={() => setShowRejectionModal(true)}
                  icon={XCircle}
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Status indicators */}
            {post.isApproved && (
              <Banner tone="success" icon={CheckCircle}>
                <Text variant="bodyMd" as="p">
                  This post has been approved and is ready for reward distribution.
                </Text>
              </Banner>
            )}

            {post.isRewarded && (
              <Banner tone="success" icon={Gift}>
                <Text variant="bodyMd" as="p">
                  Reward has been generated and sent to the influencer.
                </Text>
              </Banner>
            )}
          </div>
        </div>
      </Card>

      {/* Approval Modal */}
      <Modal
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve UGC Post"
        primaryAction={{
          content: 'Approve',
          onAction: handleApprove,
          loading: isProcessing,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowApprovalModal(false),
          },
        ]}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Text variant="bodyMd" as="p">
              Approve this UGC post and optionally generate an automatic reward for the influencer.
            </Text>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={approvalOptions.autoReward}
                onChange={(e) => setApprovalOptions({
                  ...approvalOptions,
                  autoReward: e.target.checked
                })}
              />
              <Text variant="bodyMd" as="p">
                Generate automatic reward
              </Text>
            </div>

            {approvalOptions.autoReward && (
              <div style={{ padding: '1rem', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
                <Text variant="bodyMd" as="p" fontWeight="bold">
                  Reward Configuration
                </Text>
                
                <div style={{ marginTop: '1rem' }}>
                  <Select
                    label="Reward Type"
                    options={[
                      { label: 'Percentage Discount', value: 'PERCENTAGE' },
                      { label: 'Fixed Amount Discount', value: 'FIXED_AMOUNT' },
                    ]}
                    value={approvalOptions.rewardType}
                    onChange={(value) => setApprovalOptions({
                      ...approvalOptions,
                      rewardType: value
                    })}
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <TextField
                    label="Reward Amount"
                    type="number"
                    value={`${approvalOptions.rewardAmount || suggestedReward}`}
                    onChange={(value) => setApprovalOptions({
                      ...approvalOptions,
                      rewardAmount: parseFloat(value) || 0
                    })}
                    suffix={approvalOptions.rewardType === 'PERCENTAGE' ? '%' : '$'}
                    helpText={`Suggested: ${suggestedReward}${approvalOptions.rewardType === 'PERCENTAGE' ? '%' : '$'} based on engagement`}
                    autoComplete="off"
                  />
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px' }}>
                  <Text variant="bodySm" as="p" fontWeight="bold">
                    Reward Details:
                  </Text>
                  <Text variant="bodySm" as="p">
                    • One-time use discount code
                  </Text>
                  <Text variant="bodySm" as="p">
                    • 30-day expiration
                  </Text>
                  <Text variant="bodySm" as="p">
                    • Automatically sent via DM
                  </Text>
                </div>
              </div>
            )}
          </div>
        </Modal.Section>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        open={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Reject UGC Post"
        primaryAction={{
          content: 'Reject',
          onAction: handleReject,
          loading: isProcessing,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowRejectionModal(false),
          },
        ]}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Text variant="bodyMd" as="p">
              Provide a reason for rejecting this UGC post. This will help improve future content quality.
            </Text>

            <Select
              label="Rejection Reason"
              options={[
                { label: 'Content not relevant to brand', value: 'not_relevant' },
                { label: 'Poor content quality', value: 'poor_quality' },
                { label: 'Inappropriate content', value: 'inappropriate' },
                { label: 'Does not meet guidelines', value: 'guidelines' },
                { label: 'Other', value: 'other' },
              ]}
              value={rejectionReason}
              onChange={setRejectionReason}
            />

            {rejectionReason === 'other' && (
              <TextField
                label="Custom Reason"
                value={rejectionReason}
                onChange={setRejectionReason}
                multiline={3}
                placeholder="Please provide a specific reason for rejection..."
                autoComplete="off"
              />
            )}
          </div>
        </Modal.Section>
      </Modal>
    </div>
  );
} 