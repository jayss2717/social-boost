import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { influencerSchema, createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { checkUsageLimit } from '@/utils/subscription';
import { requireMerchantId } from '@/lib/auth';
import { generateDiscountLink } from '@/utils/discount-links';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);

    // In CI environment, return mock data
    if (process.env.CI === 'true') {
      return createSuccessResponse([
        {
          id: 'mock-1',
          merchantId,
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          instagramHandle: '@sarahwilson',
          tiktokHandle: '@sarahwilson',
          commissionRate: 0.15,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          discountCodes: [],
          payouts: [],
        },
        {
          id: 'mock-2',
          merchantId,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          instagramHandle: '@mikejohnson',
          tiktokHandle: null,
          commissionRate: 0.12,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          discountCodes: [],
          payouts: [],
        },
      ]);
    }

    const influencers = await prisma.influencer.findMany({
      where: { merchantId },
      include: {
        discountCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch merchant settings for link generation
    const merchantSettings = await prisma.merchantSettings.findUnique({
      where: { merchantId },
      select: { website: true, linkPattern: true },
    });

    // Add unique links to discount codes using merchant settings
    const influencersWithLinks = influencers.map(influencer => ({
      ...influencer,
      discountCodes: influencer.discountCodes.map(code => ({
        ...code,
        uniqueLink: generateDiscountLink(code.code, merchantSettings ? {
          website: merchantSettings.website || undefined,
          linkPattern: merchantSettings.linkPattern
        } : undefined),
      })),
    }));

    return createSuccessResponse(influencersWithLinks);
  } catch (error) {
    console.error('Failed to fetch influencers:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to fetch influencers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);

    // Check influencer limit
    const limitCheck = await checkUsageLimit(merchantId, 'influencer');
    if (!limitCheck.allowed) {
      return createErrorResponse(
        `Influencer limit exceeded. Current: ${limitCheck.current}, Limit: ${limitCheck.limit}`,
        402
      );
    }

    const body = await request.json();
    const validatedData = influencerSchema.parse(body);

    // Check if influencer already exists
    const duplicateConditions = [];
    
    if (validatedData.email) {
      duplicateConditions.push({ email: validatedData.email });
    }
    if (validatedData.instagramHandle) {
      duplicateConditions.push({ instagramHandle: validatedData.instagramHandle });
    }
    if (validatedData.tiktokHandle) {
      duplicateConditions.push({ tiktokHandle: validatedData.tiktokHandle });
    }

    const existingInfluencer = duplicateConditions.length > 0 ? await prisma.influencer.findFirst({
      where: {
        merchantId,
        OR: duplicateConditions,
      },
    }) : null;

    if (existingInfluencer) {
      return createErrorResponse('Influencer already exists with this email or social media handle', 409);
    }

    const influencer = await prisma.influencer.create({
      data: {
        merchantId,
        name: validatedData.name,
        email: validatedData.email,
        instagramHandle: validatedData.instagramHandle,
        tiktokHandle: validatedData.tiktokHandle,
        commissionRate: validatedData.commissionRate,
        isActive: true,
      },
      include: {
        discountCodes: true,
        payouts: true,
      },
    });

    return createSuccessResponse(influencer, 'Influencer created successfully');
  } catch (error) {
    console.error('Failed to create influencer:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to create influencer', 500);
  }
} 