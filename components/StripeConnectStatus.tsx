import React from 'react';
import { Badge, Button, InlineStack, Text } from '@shopify/polaris';
import { CreditCard } from 'lucide-react';

interface StripeConnectStatusProps {
  influencerId: string;
  status?: 'NOT_CONNECTED' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'ERROR';
  onConnect: (influencerId: string) => void;
}

export function StripeConnectStatus({ influencerId, status = 'NOT_CONNECTED', onConnect }: StripeConnectStatusProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return <Badge tone="success">Connected</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge tone="attention">Pending</Badge>;
      case 'ERROR':
        return <Badge tone="critical">Error</Badge>;
      default:
        return <Badge tone="warning">Not Connected</Badge>;
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'ACTIVE':
        return 'Ready for payouts';
      case 'PENDING_VERIFICATION':
        return 'Account verification in progress';
      case 'ERROR':
        return 'Connection failed';
      default:
        return 'Connect to receive payouts';
    }
  };

  return (
    <InlineStack align="space-between">
      <div>
        <Text variant="bodySm" as="p">
          {getStatusDescription()}
        </Text>
        {getStatusBadge()}
      </div>
      {status === 'NOT_CONNECTED' && (
        <Button
          size="slim"
          icon={CreditCard}
          onClick={() => onConnect(influencerId)}
        >
          Connect
        </Button>
      )}
    </InlineStack>
  );
} 