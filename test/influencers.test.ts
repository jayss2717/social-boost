import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST, GET } from '../app/api/influencers/route';
import { prisma } from '../lib/prisma';
import { influencerSchema } from '../utils/validation';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    influencer: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    merchant: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('../lib/auth', () => ({
  requireMerchantId: vi.fn(() => 'test-merchant-id'),
}));

// Mock subscription utils
vi.mock('../utils/subscription', () => ({
  checkUsageLimit: vi.fn(() => ({ allowed: true, current: 0, limit: 10 })),
}));

describe('Influencers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/influencers', () => {
    it('should create a new influencer successfully', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'Test Influencer',
        email: 'test@example.com',
        commissionRate: 0.1,
        isActive: true,
        merchantId: 'test-merchant-id',
        discountCodes: [],
        payouts: [],
      };

      (prisma.merchant.findUnique as any).mockResolvedValue({
        id: 'test-merchant-id',
        shop: 'test-shop.myshopify.com',
      });

      (prisma.influencer.findFirst as any).mockResolvedValue(null);
      (prisma.influencer.create as any).mockResolvedValue(mockInfluencer);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          name: 'Test Influencer',
          email: 'test@example.com',
          commissionRate: 0.1,
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test Influencer');
      expect(prisma.influencer.create).toHaveBeenCalledWith({
        data: {
          merchantId: 'test-merchant-id',
          name: 'Test Influencer',
          email: 'test@example.com',
          commissionRate: 0.1,
          isActive: true,
        },
        include: {
          discountCodes: true,
          payouts: true,
        },
      });
    });

    it('should return 400 for invalid data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          name: '', // Invalid: empty name
          email: 'invalid-email',
          commissionRate: 1.5, // Invalid: exceeds max
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation failed');
    });

    it('should return 409 for duplicate influencer', async () => {
      const mockExistingInfluencer = {
        id: 'existing-id',
        name: 'Existing Influencer',
        email: 'test@example.com',
      };

      (prisma.merchant.findUnique as any).mockResolvedValue({
        id: 'test-merchant-id',
        shop: 'test-shop.myshopify.com',
      });

      (prisma.influencer.findFirst as any).mockResolvedValue(mockExistingInfluencer);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          name: 'New Influencer',
          email: 'test@example.com', // Same email as existing
          commissionRate: 0.1,
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should return 401 when merchant ID is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Test Influencer',
          email: 'test@example.com',
          commissionRate: 0.1,
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Merchant ID required');
    });
  });

  describe('GET /api/influencers', () => {
    it('should return influencers list successfully', async () => {
      const mockInfluencers = [
        {
          id: 'influencer-1',
          name: 'Influencer 1',
          email: 'influencer1@example.com',
          commissionRate: 0.1,
          isActive: true,
          discountCodes: [],
          payouts: [],
        },
        {
          id: 'influencer-2',
          name: 'Influencer 2',
          email: 'influencer2@example.com',
          commissionRate: 0.15,
          isActive: true,
          discountCodes: [],
          payouts: [],
        },
      ];

      (prisma.influencer.findMany as any).mockResolvedValue(mockInfluencers);
      (prisma.merchantSettings.findUnique as any).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-merchant-id': 'test-merchant-id',
        },
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Influencer 1');
    });

    it('should return 401 when merchant ID is missing', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {},
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Merchant ID required');
    });
  });
});

describe('Influencer Validation', () => {
  it('should validate correct influencer data', () => {
    const validData = {
      name: 'Test Influencer',
      email: 'test@example.com',
      instagramHandle: '@testuser',
      tiktokHandle: '@tiktokuser',
      commissionRate: 0.1,
    };

    const result = influencerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      name: 'Test Influencer',
      email: 'invalid-email',
      commissionRate: 0.1,
    };

    const result = influencerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid email');
    }
  });

  it('should reject commission rate outside valid range', () => {
    const invalidData = {
      name: 'Test Influencer',
      email: 'test@example.com',
      commissionRate: 1.5, // Should be between 0.01 and 1.0
    };

    const result = influencerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept optional social media handles', () => {
    const validData = {
      name: 'Test Influencer',
      email: 'test@example.com',
      commissionRate: 0.1,
      // No social media handles
    };

    const result = influencerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
}); 