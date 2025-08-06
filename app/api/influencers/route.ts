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
    console.log('POST /api/influencers - Starting request');
    
    // Get merchant ID with better error handling
    let merchantId: string;
    try {
      merchantId = requireMerchantId(request);
      console.log('Merchant ID obtained:', merchantId);
    } catch (error) {
      console.error('Failed to get merchant ID:', error);
      return createErrorResponse('Merchant ID required', 401);
    }

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      console.error('Merchant not found:', merchantId);
      return createErrorResponse('Merchant not found', 404);
    }

    console.log('✅ Merchant verified:', {
      id: merchant.id,
      shop: merchant.shop,
      shopName: merchant.shopName,
    });

    // Check influencer limit
    try {
      const limitCheck = await checkUsageLimit(merchantId, 'influencer');
      console.log('Usage limit check:', limitCheck);
      
      if (!limitCheck.allowed) {
        return createErrorResponse(
          `Influencer limit exceeded. Current: ${limitCheck.current}, Limit: ${limitCheck.limit}`,
          402
        );
      }
    } catch (error) {
      console.error('Usage limit check failed:', error);
      // Continue without limit check if it fails
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return createErrorResponse('Invalid request body', 400);
    }

    // Validate data
    let validatedData;
    try {
      validatedData = influencerSchema.parse(body);
      console.log('Validated data:', validatedData);
    } catch (error) {
      console.error('Validation failed:', error);
      return createErrorResponse(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
    }

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

    if (duplicateConditions.length > 0) {
      console.log('🔍 Checking for duplicate influencers with merchantId:', merchantId);
      console.log('🔍 Duplicate conditions:', duplicateConditions);
      
      const existingInfluencer = await prisma.influencer.findFirst({
        where: {
          merchantId,
          OR: duplicateConditions,
        },
      });

      if (existingInfluencer) {
        console.log('❌ Duplicate influencer found:', {
          id: existingInfluencer.id,
          merchantId: existingInfluencer.merchantId,
          name: existingInfluencer.name,
          email: existingInfluencer.email,
          instagramHandle: existingInfluencer.instagramHandle,
          tiktokHandle: existingInfluencer.tiktokHandle,
        });
        return createErrorResponse('Influencer already exists with this email or social media handle', 409);
      } else {
        console.log('✅ No duplicate influencer found');
      }
      
      // Additional debug: Check if this email/username exists in ANY merchant (shouldn't happen)
      if (validatedData.email) {
        const globalDuplicate = await prisma.influencer.findFirst({
          where: {
            email: validatedData.email,
            merchantId: { not: merchantId }, // Different merchant
          },
        });
        if (globalDuplicate) {
          console.log('⚠️ Found influencer with same email in different merchant:', {
            influencerId: globalDuplicate.id,
            merchantId: globalDuplicate.merchantId,
            email: globalDuplicate.email,
          });
        }
      }
    }

    // Create influencer
    console.log('Creating influencer with data:', {
      merchantId,
      name: validatedData.name,
      email: validatedData.email,
      instagramHandle: validatedData.instagramHandle,
      tiktokHandle: validatedData.tiktokHandle,
      commissionRate: validatedData.commissionRate,
    });

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

    console.log('Influencer created successfully:', influencer.id);
    return createSuccessResponse(influencer, 'Influencer created successfully');
  } catch (error) {
    console.error('Failed to create influencer:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message === 'Merchant ID required') {
        return createErrorResponse('Merchant ID required', 401);
      }
      if (error.message.includes('Unique constraint')) {
        return createErrorResponse('Influencer already exists with this information', 409);
      }
      if (error.message.includes('Foreign key constraint')) {
        return createErrorResponse('Invalid merchant ID', 400);
      }
    }
    
    return createErrorResponse('Failed to create influencer', 500);
  }
} 