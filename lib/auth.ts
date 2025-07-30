import { NextRequest } from 'next/server';

// Demo merchant ID for development
const DEMO_MERCHANT_ID = 'cmdpgbpw60003vgpvtdgr4pj5';

export function getMerchantId(request: NextRequest): string | null {
  // In development, use demo merchant ID if no header is provided
  const merchantId = request.headers.get('x-merchant-id');
  
  if (merchantId) {
    return merchantId;
  }
  
  // For development, return demo merchant ID
  if (process.env.NODE_ENV === 'development') {
    return DEMO_MERCHANT_ID;
  }
  
  return null;
}

export function requireMerchantId(request: NextRequest): string {
  const merchantId = getMerchantId(request);
  
  if (!merchantId) {
    throw new Error('Merchant ID required');
  }
  
  return merchantId;
} 