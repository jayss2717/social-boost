import { prisma } from './prisma';
import type { Merchant } from '../types';

/**
 * Validates if a merchant has proper Shopify credentials
 */
export function validateMerchantCredentials(merchant: any): boolean {
  return merchant.accessToken && 
         merchant.accessToken !== 'pending' && 
         merchant.accessToken !== 'test-access-token' &&
         merchant.shopifyShopId &&
         merchant.shopifyShopId !== 'NULL';
}

/**
 * Attempts to fix a merchant's credentials by fetching from Shopify
 */
export async function fixMerchantCredentials(shop: string): Promise<{ success: boolean; message: string }> {
  try {
    // First, try to get the merchant from database
    const merchant = await prisma.merchant.findUnique({
      where: { shop }
    });

    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }

    // If credentials are already valid, no need to fix
    if (validateMerchantCredentials(merchant)) {
      return { success: true, message: 'Credentials are already valid' };
    }

    // Try to fetch shop data from Shopify using the shop domain
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': merchant.accessToken,
      },
    });

    if (!shopResponse.ok) {
      return { 
        success: false, 
        message: 'Cannot fetch shop data - merchant needs to complete OAuth flow' 
      };
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    // Update the merchant with real data
    await prisma.merchant.update({
      where: { shop },
      data: {
        shopifyShopId: shopInfo.id.toString(),
        shopName: shopInfo.name,
        shopEmail: shopInfo.email,
        shopDomain: shopInfo.domain,
        shopCurrency: shopInfo.currency,
        shopTimezone: shopInfo.iana_timezone,
        shopLocale: shopInfo.locale,
      }
    });

    return { 
      success: true, 
      message: 'Merchant credentials updated successfully' 
    };

  } catch (error) {
    console.error('Error fixing merchant credentials:', error);
    return { 
      success: false, 
      message: 'Failed to fix credentials - merchant needs to complete OAuth flow' 
    };
  }
} 