import { prisma } from '@/lib/prisma';

// Utility function to validate and refresh Shopify access tokens
export async function validateAndRefreshToken(shop: string): Promise<{ isValid: boolean; needsReauth: boolean }> {
  try {
    // Get merchant from database
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      select: { accessToken: true, isActive: true }
    });

    if (!merchant || !merchant.isActive) {
      console.log('❌ Merchant not found or inactive:', shop);
      return { isValid: false, needsReauth: true };
    }

    if (!merchant.accessToken) {
      console.log('❌ No access token found for merchant:', shop);
      return { isValid: false, needsReauth: true };
    }

    // Test the token with a simple API call
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': merchant.accessToken,
      },
    });

    if (response.status === 401) {
      console.log('❌ Shopify access token is invalid/expired for:', shop);
      return { isValid: false, needsReauth: true };
    }

    if (!response.ok) {
      console.log('⚠️ Shopify API returned non-401 error:', response.status);
      return { isValid: false, needsReauth: false };
    }

    console.log('✅ Shopify access token is valid for:', shop);
    return { isValid: true, needsReauth: false };

  } catch (error) {
    console.error('❌ Error validating Shopify token:', error);
    return { isValid: false, needsReauth: true };
  }
}

// Generate re-authentication URL for a shop
export function generateReauthUrl(shop: string): string {
  const scopes = 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products,read_price_rules,write_price_rules,read_reports,read_shopify_payments_payouts';
  const redirectUri = `https://socialboost-blue.vercel.app/api/auth/shopify/callback`;
  
  return `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${Math.random().toString(36).substring(2, 15)}`;
}

// Check if a merchant needs re-authentication
export async function checkMerchantAuth(merchantId: string): Promise<{ needsReauth: boolean; reauthUrl?: string }> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { shop: true, accessToken: true, isActive: true }
    });

    if (!merchant || !merchant.isActive) {
      return { needsReauth: true, reauthUrl: merchant ? generateReauthUrl(merchant.shop) : undefined };
    }

    const { isValid, needsReauth } = await validateAndRefreshToken(merchant.shop);
    
    if (needsReauth) {
      return { needsReauth: true, reauthUrl: generateReauthUrl(merchant.shop) };
    }

    return { needsReauth: false };

  } catch (error) {
    console.error('❌ Error checking merchant auth:', error);
    return { needsReauth: true };
  }
} 