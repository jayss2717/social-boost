export interface MerchantSettings {
  website?: string;
  linkPattern?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  expiresAt?: string;
  uniqueLink?: string;
}

/**
 * Generate a discount link based on merchant settings
 */
export function generateDiscountLink(
  code: string, 
  merchantSettings?: MerchantSettings
): string {
  // If no merchant settings or website, return a placeholder
  if (!merchantSettings?.website) {
    return `https://your-store.com/discount/${code}`;
  }

  // Clean the website URL (remove trailing slash)
  const cleanWebsite = merchantSettings.website.replace(/\/$/, '');
  
  // Use custom link pattern if provided, otherwise use default
  const linkPattern = merchantSettings.linkPattern || '/discount/{{code}}';
  
  // Replace {{code}} placeholder with actual code
  const uniqueLink = linkPattern.replace('{{code}}', code);
  
  return `${cleanWebsite}${uniqueLink}`;
}

/**
 * Validate website URL format
 */
export function validateWebsite(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Format website URL for display
 */
export function formatWebsite(url: string): string {
  if (!url) return '';
  
  // Remove protocol for cleaner display
  return url.replace(/^https?:\/\//, '');
}

/**
 * Extract discount code from URL
 */
export function extractCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Generate QR code URL for discount link
 */
export function generateQRCodeUrl(link: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;
}

/**
 * Generate social sharing text
 */
export function generateShareText(
  code: string, 
  discountValue: number, 
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT',
  website?: string
): string {
  const discountText = discountType === 'PERCENTAGE' 
    ? `${discountValue}% off` 
    : `$${discountValue} off`;
    
  const websiteText = website ? ` at ${formatWebsite(website)}` : '';
  
  return `Use code ${code}${websiteText} for ${discountText}!`;
} 