import { z } from 'zod';

// Base schemas
export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/);
export const urlSchema = z.string().url();

// Influencer validation
export const influencerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  instagramHandle: z.string().regex(/^@?[a-zA-Z0-9._]+$/).optional().or(z.literal('')),
  tiktokHandle: z.string().regex(/^@?[a-zA-Z0-9._]+$/).optional().or(z.literal('')),
  commissionRate: z.number().min(0.01).max(100),
});

// UGC Post validation
export const ugcPostSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER']),
  postUrl: urlSchema,
  postId: z.string().min(1),
  content: z.string().optional(),
  mediaUrls: z.array(urlSchema).optional(),
  engagement: z.number().min(0),
  influencerId: z.string().optional(),
  influencerName: z.string().optional(),
  influencerEmail: emailSchema.optional(),
  influencerHandle: z.string().optional(),
});

// Discount Code validation
export const discountCodeSchema = z.object({
  influencerId: z.string(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0.01),
  usageLimit: z.number().min(1).max(10000),
  expiresAt: z.string().datetime().optional(),
});

// Payout validation
export const payoutSchema = z.object({
  influencerId: z.string(),
  amount: z.number().min(0.01),
  commissionRate: z.number().min(0.01).max(100),
  salesAmount: z.number().min(0),
});

// Settings validation
export const settingsSchema = z.object({
  name: z.string().min(1),
  email: emailSchema,
  website: z.string().optional(),
  linkPattern: z.string().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
  }),
  discountSettings: z.object({
    defaultPercentage: z.number().min(0).max(100),
    maxPercentage: z.number().min(0).max(100),
    minPercentage: z.number().min(0).max(100),
    autoApprove: z.boolean(),
  }),
  commissionSettings: z.object({
    defaultRate: z.number().min(0).max(100),
    maxRate: z.number().min(0).max(100),
    minRate: z.number().min(0).max(100),
    autoPayout: z.boolean(),
  }),
  ugcSettings: z.object({
    autoApprove: z.boolean(),
    minEngagement: z.number().min(0),
    requiredHashtags: z.array(z.string()),
    excludedWords: z.array(z.string()),
  }),
  payoutSettings: z.object({
    autoPayout: z.boolean(),
    payoutSchedule: z.enum(['WEEKLY', 'MONTHLY', 'MANUAL']),
    minimumPayout: z.number().min(0),
  }),
});

// Subscription upgrade validation
export const subscriptionUpgradeSchema = z.object({
  plan: z.enum(['Pro', 'Scale']),
});

// Webhook validation
export const webhookSchema = z.object({
  shop: z.string(),
  id: z.string().optional(),
  line_items: z.array(z.any()).optional(),
  discount_codes: z.array(z.any()).optional(),
  total_price: z.string().optional(),
  subtotal_price: z.string().optional(),
});

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

// Error response helper
export const createErrorResponse = (message: string, status: number = 400) => {
  return Response.json({ error: message }, { status });
};

// Success response helper
export const createSuccessResponse = (data: any, message?: string) => {
  return Response.json({ 
    success: true, 
    data, 
    message 
  });
}; 