import React, { useState } from 'react';
import { Button, Card, Text, InlineStack, Badge, Banner } from '@shopify/polaris';
import { Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Payout {
  id: string;
  influencerId: string;
  influencer: {
    name: string;
    email: string;
    stripeAccountId?: string;
  };
  commissionAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  processedAt?: string;
  stripeTransferId?: string;
}

interface PayoutProcessorProps {
  payout: Payout;
  onProcess: (payoutId: string) => Promise<void>;
  onRefresh: () => void;
}

export function PayoutProcessor({ payout, onProcess, onRefresh }: PayoutProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await onProcess(payout.id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payout');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (payout.status) {
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

  const getStatusIcon = () => {
    switch (payout.status) {
      case 'PENDING':
        return <Clock size={16} />;
      case 'PROCESSING':
        return <Clock size={16} />;
      case 'COMPLETED':
        return <CheckCircle size={16} />;
      case 'FAILED':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const canProcess = payout.status === 'PENDING' && payout.influencer.stripeAccountId;

  return (
    <Card>
      <div style={{ padding: '1rem' }}>
        <InlineStack align="space-between">
          <div>
            <Text variant="headingMd" as="h3">
              {payout.influencer.name}
            </Text>
            <Text variant="bodySm" as="p" tone="subdued">
              {payout.influencer.email}
            </Text>
            <Text variant="bodyMd" as="p">
              ${payout.commissionAmount.toFixed(2)} commission
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            {getStatusBadge()}
            <div style={{ marginTop: '0.5rem' }}>
              {getStatusIcon()}
            </div>
          </div>
        </InlineStack>

        {error && (
          <Banner tone="critical" style={{ marginTop: '1rem' }}>
            {error}
          </Banner>
        )}

        {!payout.influencer.stripeAccountId && (
          <Banner tone="warning" style={{ marginTop: '1rem' }}>
            Influencer needs to connect their Stripe account to receive payouts.
          </Banner>
        )}

        {canProcess && (
          <div style={{ marginTop: '1rem' }}>
            <Button
              primary
              icon={Send}
              loading={isProcessing}
              onClick={handleProcess}
              disabled={isProcessing}
            >
              Process Payout
            </Button>
          </div>
        )}

        {payout.stripeTransferId && (
          <Text variant="bodySm" as="p" tone="subdued" style={{ marginTop: '1rem' }}>
            Transfer ID: {payout.stripeTransferId}
          </Text>
        )}
      </div>
    </Card>
  );
} 