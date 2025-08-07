'use client';

import { Modal, Text, BlockStack, Banner } from '@shopify/polaris';
import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import React from 'react';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  shop: string;
}

export default function DeleteAccountModal({ open, onClose, onConfirm, shop }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
      // Success - redirect will be handled by the parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Account"
      primaryAction={{
        content: isDeleting ? 'Deleting...' : 'Delete Account',
        destructive: true,
        onAction: handleConfirm,
        disabled: isDeleting,
        loading: isDeleting,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
          disabled: isDeleting,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Banner
            title="This action cannot be undone"
            tone="critical"
            icon={() => React.createElement(AlertTriangle, { className: "w-5 h-5" })}
          >
            <p>
              Deleting your account will permanently remove all your data including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All influencer relationships</li>
              <li>UGC posts and content</li>
              <li>Discount codes and campaigns</li>
              <li>Payout history and transactions</li>
              <li>Analytics and performance data</li>
              <li>Account settings and preferences</li>
            </ul>
          </Banner>

          <div className="bg-gray-50 p-4 rounded-lg">
            <Text variant="bodyMd" fontWeight="semibold" as="p">
              Account to be deleted: {shop}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              If you want to use SocialBoost again in the future, you&apos;ll need to reinstall the app.
            </Text>
          </div>

          {error && (
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          )}

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Trash2 className="w-4 h-4" />
            <span>This action is irreversible and will delete all your data permanently.</span>
          </div>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 