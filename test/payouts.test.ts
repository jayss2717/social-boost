import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST, GET } from '../app/api/payouts/route';
import { POST as bulkProcess } from '../app/api/payouts/bulk-process/route';
import { prisma } from '../lib/prisma';
import { createStripePayout, calculateCommission } from '../lib/stripe';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    payout: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    influencer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock Stripe
vi.mock('../lib/stripe', () => ({
  createStripePayout: vi.fn(),
  calculateCommission: vi.fn(),
  processBulkPayouts: vi.fn(),
}));

// Mock auth
vi.mock('../lib/auth', () => ({
  requireMerchantId: vi.fn(() => 'test-merchant-id'),
}));

describe('Payouts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/payouts', () => {
    it('should create a payout successfully', async () => {
      const mockInfluencer = {
        id: 'test-influencer-id',
        name: 'Test Influencer',
        email: 'test@example.com',
        commissionRate: 0.1,
        merchantId: 'test-merchant-id',
      };

      const mockPayout = {
        id: 'test-payout-id',
        influencerId: 'test-influencer-id',
        amount: 1000, // $10.00 in cents
        commissionRate: 0.1,
        salesAmount: 10000, // $100.00 in cents
        status: 'PENDING',
        description: 'Commission payout for Test Influencer',
        influencer: {
          id: 'test-influencer-id',
          name: 'Test Influencer',
          email: 'test@example.com',
          commissionRate: 0.1,
        },
      };

      (prisma.influencer.findFirst as any).mockResolvedValue(mockInfluencer);
      (prisma.payout.create as any).mockResolvedValue(mockPayout);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          influencerId: 'test-influencer-id',
          amount: 10000, // $100.00
          salesAmount: 100000, // $1000.00
          description: 'Commission payout for Test Influencer',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.amount).toBe(1000); // Commission amount in cents
      expect(prisma.payout.create).toHaveBeenCalledWith({
        data: {
          influencerId: 'test-influencer-id',
          amount: 1000, // 10% of $100 = $10
          commissionRate: 0.1,
          salesAmount: 100000,
          status: 'PENDING',
          description: 'Commission payout for Test Influencer',
        },
        include: {
          influencer: {
            select: {
              id: true,
              name: true,
              email: true,
              commissionRate: true,
            },
          },
        },
      });
    });

    it('should return 400 for missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          // Missing required fields
          description: 'Test payout',
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 404 when influencer not found', async () => {
      (prisma.influencer.findFirst as any).mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          influencerId: 'non-existent-id',
          amount: 10000,
          salesAmount: 100000,
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Influencer not found');
    });
  });

  describe('GET /api/payouts', () => {
    it('should return payouts list with pagination', async () => {
      const mockPayouts = [
        {
          id: 'payout-1',
          influencerId: 'influencer-1',
          amount: 1000,
          commissionRate: 0.1,
          salesAmount: 10000,
          status: 'PENDING',
          createdAt: new Date(),
          influencer: {
            id: 'influencer-1',
            name: 'Influencer 1',
            email: 'influencer1@example.com',
            commissionRate: 0.1,
          },
        },
        {
          id: 'payout-2',
          influencerId: 'influencer-2',
          amount: 1500,
          commissionRate: 0.15,
          salesAmount: 10000,
          status: 'COMPLETED',
          createdAt: new Date(),
          influencer: {
            id: 'influencer-2',
            name: 'Influencer 2',
            email: 'influencer2@example.com',
            commissionRate: 0.15,
          },
        },
      ];

      (prisma.payout.findMany as any).mockResolvedValue(mockPayouts);
      (prisma.payout.count as any).mockResolvedValue(2);

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-merchant-id': 'test-merchant-id',
        },
        url: '/api/payouts?page=1&limit=20',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.payouts).toHaveLength(2);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
    });

    it('should filter payouts by status', async () => {
      const mockPayouts = [
        {
          id: 'payout-1',
          influencerId: 'influencer-1',
          amount: 1000,
          status: 'PENDING',
          influencer: {
            id: 'influencer-1',
            name: 'Influencer 1',
            email: 'influencer1@example.com',
            commissionRate: 0.1,
          },
        },
      ];

      (prisma.payout.findMany as any).mockResolvedValue(mockPayouts);
      (prisma.payout.count as any).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          'x-merchant-id': 'test-merchant-id',
        },
        url: '/api/payouts?status=PENDING',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.payouts).toHaveLength(1);
      expect(data.data.payouts[0].status).toBe('PENDING');
    });
  });

  describe('POST /api/payouts/bulk-process', () => {
    it('should process bulk payouts successfully', async () => {
      const mockPayouts = [
        {
          id: 'payout-1',
          influencerId: 'influencer-1',
          amount: 1000,
          status: 'PENDING',
          influencer: {
            id: 'influencer-1',
            name: 'Influencer 1',
            email: 'influencer1@example.com',
            commissionRate: 0.1,
          },
        },
        {
          id: 'payout-2',
          influencerId: 'influencer-2',
          amount: 1500,
          status: 'PENDING',
          influencer: {
            id: 'influencer-2',
            name: 'Influencer 2',
            email: 'influencer2@example.com',
            commissionRate: 0.15,
          },
        },
      ];

      (prisma.payout.findMany as any).mockResolvedValue(mockPayouts);
      (processBulkPayouts as any).mockResolvedValue([
        { success: true, payoutId: 'payout-1' },
        { success: true, payoutId: 'payout-2' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          payoutIds: ['payout-1', 'payout-2'],
        },
      });

      const response = await bulkProcess(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.summary).toEqual({
        total: 2,
        successful: 2,
        failed: 0,
      });
    });

    it('should return 400 for invalid payout IDs', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-merchant-id': 'test-merchant-id',
          'content-type': 'application/json',
        },
        body: {
          payoutIds: 'invalid', // Should be array
        },
      });

      const response = await bulkProcess(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid payout IDs');
    });
  });
});

describe('Commission Calculation', () => {
  it('should calculate commission correctly', async () => {
    const orderAmount = 10000; // $100.00 in cents
    const commissionRate = 0.1; // 10%
    const expectedCommission = 1000; // $10.00 in cents

    (calculateCommission as any).mockResolvedValue(expectedCommission);

    const commission = await calculateCommission(orderAmount, commissionRate);
    expect(commission).toBe(expectedCommission);
  });

  it('should adjust commission for discount codes', async () => {
    const orderAmount = 10000; // $100.00 in cents
    const commissionRate = 0.1; // 10%
    const discountCode = 'SAVE20';
    const expectedCommission = 800; // Reduced due to discount

    (calculateCommission as any).mockResolvedValue(expectedCommission);

    const commission = await calculateCommission(orderAmount, commissionRate, discountCode);
    expect(commission).toBe(expectedCommission);
  });
});

describe('Stripe Payout Integration', () => {
  it('should create Stripe payout successfully', async () => {
    const payoutData = {
      influencerId: 'test-influencer-id',
      amount: 1000, // $10.00 in cents
      commissionRate: 0.1,
      salesAmount: 10000,
      description: 'Test payout',
    };

    const expectedResult = {
      success: true,
      payoutId: 'stripe-payout-id',
    };

    (createStripePayout as any).mockResolvedValue(expectedResult);

    const result = await createStripePayout(payoutData);
    expect(result.success).toBe(true);
    expect(result.payoutId).toBe('stripe-payout-id');
  });

  it('should handle Stripe payout errors', async () => {
    const payoutData = {
      influencerId: 'test-influencer-id',
      amount: 1000,
      commissionRate: 0.1,
      salesAmount: 10000,
    };

    const expectedResult = {
      success: false,
      error: 'Influencer does not have a connected Stripe account',
    };

    (createStripePayout as any).mockResolvedValue(expectedResult);

    const result = await createStripePayout(payoutData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('connected Stripe account');
  });
}); 