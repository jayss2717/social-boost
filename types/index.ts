export interface Merchant {
  id: string;
  shop: string;
  accessToken: string;
  scope: string;
  isActive: boolean;
  
  // Shopify data
  shopifyShopId?: string;
  shopName?: string;
  shopEmail?: string;
  shopDomain?: string;
  shopCurrency?: string;
  shopTimezone?: string;
  shopLocale?: string;
  
  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;
  onboardingData?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  ugcLimit: number;
  influencerLimit: number;
}

export interface Subscription {
  id: string;
  merchantId: string;
  planId: string;
  stripeSubId?: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  currentPeriodEnd: Date;
}

export interface Influencer {
  id: string;
  merchantId: string;
  name: string;
  email?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  stripeAccountId?: string;
  commissionRate: number;
  isActive: boolean;
}

export interface UgcPost {
  id: string;
  merchantId: string;
  influencerId?: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER';
  postUrl: string;
  postId: string;
  content?: string;
  mediaUrls: string[];
  engagement: number;
  isApproved: boolean;
  isRewarded: boolean;
  rewardAmount?: number;
}

export interface DiscountCode {
  id: string;
  merchantId: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  expiresAt?: Date;
}

export interface Payout {
  id: string;
  merchantId: string;
  influencerId: string;
  amount: number;
  stripeTransferId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  periodStart: Date;
  periodEnd: Date;
}

export interface SubscriptionUsage {
  ugcCount: number;
  influencerCount: number;
  ugcLimit: number;
  influencerLimit: number;
}

export interface Metrics {
  totalUgcPosts: number;
  totalInfluencers: number;
  totalRevenue: number;
  pendingPayouts: number;
  approvedPosts: number;
  pendingApproval: number;
}

export interface SocialMediaSettings {
  instagram: string;
  tiktok: string;
  twitter: string;
  youtube: string;
}

export interface DiscountSettings {
  defaultPercentage: number;
  maxPercentage: number;
  minPercentage: number;
  autoApprove: boolean;
}

export interface CommissionSettings {
  defaultRate: number;
  maxRate: number;
  minRate: number;
  autoPayout: boolean;
  commissionCalculationBase: 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT';
}

export interface UgcSettings {
  autoApprove: boolean;
  minEngagement: number;
  requiredHashtags: string[];
  excludedWords: string[];
  codeDelayHours: number;
  codeDelayMinutes: number;
  maxCodesPerDay: number;
  maxCodesPerInfluencer: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountUsageLimit: number;
}

export interface PayoutSettings {
  autoPayout: boolean;
  payoutSchedule: 'WEEKLY' | 'MONTHLY';
  minimumPayout: number;
}

export interface MerchantSettings {
  id: string | null;
  merchantId: string;
  name: string;
  email: string;
  website: string;
  linkPattern: string;
  socialMedia: SocialMediaSettings;
  discountSettings: DiscountSettings;
  commissionSettings: CommissionSettings;
  ugcSettings: UgcSettings;
  payoutSettings: PayoutSettings;
} 