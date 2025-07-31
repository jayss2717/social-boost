import { NextRequest } from 'next/server';

export function getMerchantId(request: NextRequest): string | null {
  const merchantId = request.headers.get('x-merchant-id');
  
  if (!merchantId) {
    console.warn('No merchant ID provided in request headers');
    return null;
  }
  
  return merchantId;
}

export function requireMerchantId(request: NextRequest): string {
  const merchantId = getMerchantId(request);
  
  if (!merchantId) {
    throw new Error('Merchant ID is required');
  }
  
  return merchantId;
} 