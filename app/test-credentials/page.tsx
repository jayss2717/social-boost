'use client';

import { useState } from 'react';
import { Card, Button, Text, Banner } from '@shopify/polaris';

interface ResultType {
  success?: boolean;
  isValid?: boolean;
  merchant?: {
    id: string;
    shop: string;
    accessToken?: string | null;
    shopifyShopId?: string | null;
    shopName?: string | null;
    isActive?: boolean;
    needsOAuth?: boolean;
  };
  requiresOAuth?: boolean;
  oauthUrl?: string;
  message?: string;
  error?: string;
}

export default function TestCredentialsPage() {
  const [shop, setShop] = useState('storev101.myshopify.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkCredentials = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/merchant/fix-credentials?shop=${shop}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check credentials');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fixCredentials = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/merchant/fix-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fix credentials');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text variant="headingMd" as="h1">
                Merchant Credentials Test
              </Text>
              
              <div>
                <label htmlFor="shop">Shop Domain:</label>
                <input
                  id="shop"
                  type="text"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    marginTop: '4px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder="e.g., storev101.myshopify.com"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <Button 
                  onClick={checkCredentials} 
                  disabled={loading || !shop}
                  loading={loading}
                >
                  Check Credentials
                </Button>
                
                <Button 
                  onClick={fixCredentials} 
                  disabled={loading || !shop}
                  loading={loading}
                  variant="primary"
                >
                  Fix Credentials
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        {result && (
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Text variant="headingMd" as="h2">
                  Results
                </Text>
                
                <div style={{ backgroundColor: '#f6f6f7', padding: '12px', borderRadius: '4px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>

                {result.requiresOAuth && (
                  <Banner tone="warning">
                    <p>
                      This merchant needs to complete the OAuth flow. 
                      <br />
                      <a href={result.oauthUrl} target="_blank" rel="noopener noreferrer">
                        Click here to start OAuth
                      </a>
                    </p>
                  </Banner>
                )}

                {result.success && result.isValid && (
                  <Banner tone="success">
                    <p>✅ Credentials are valid!</p>
                  </Banner>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 