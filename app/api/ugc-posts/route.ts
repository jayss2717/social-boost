import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ugcPostSchema, createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { checkUsageLimit } from '@/utils/subscription';
import { requireMerchantId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);

    const ugcPosts = await prisma.ugcPost.findMany({
      where: { merchantId },
      include: {
        influencer: true,
        discountCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(ugcPosts);
  } catch (error) {
    console.error('Failed to fetch UGC posts:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to fetch UGC posts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);

    // Check UGC limit
    const limitCheck = await checkUsageLimit(merchantId, 'ugc');
    if (!limitCheck.allowed) {
      return createErrorResponse(
        `UGC limit exceeded. Current: ${limitCheck.current}, Limit: ${limitCheck.limit}`,
        402
      );
    }

    const body = await request.json();
    const validatedData = ugcPostSchema.parse(body);

    // Check if post already exists
    const existingPost = await prisma.ugcPost.findFirst({
      where: {
        merchantId,
        postId: validatedData.postId,
        platform: validatedData.platform,
      },
    });

    if (existingPost) {
      return createErrorResponse('UGC post already exists with this post ID and platform', 409);
    }

    // Find or create influencer
    let influencer = null;
    if (validatedData.influencerName || validatedData.influencerEmail) {
      influencer = await prisma.influencer.findFirst({
        where: {
          merchantId,
          OR: [
            { name: validatedData.influencerName },
            { email: validatedData.influencerEmail },
          ].filter(Boolean),
        },
      });

      if (!influencer && validatedData.influencerName && validatedData.influencerEmail) {
        // Create new influencer
        influencer = await prisma.influencer.create({
          data: {
            merchantId,
            name: validatedData.influencerName,
            email: validatedData.influencerEmail,
            commissionRate: 0.1, // Default commission rate
            isActive: true,
          },
        });
      }
    }

    const ugcPost = await prisma.ugcPost.create({
      data: {
        merchantId,
        influencerId: influencer?.id,
        platform: validatedData.platform,
        postUrl: validatedData.postUrl,
        postId: validatedData.postId,
        content: validatedData.content,
        mediaUrls: validatedData.mediaUrls,
        engagement: validatedData.engagement,
        isApproved: false, // Default to pending approval
        isRewarded: false,
        rewardAmount: null,
      },
      include: {
        influencer: true,
        discountCodes: true,
      },
    });

    return createSuccessResponse(ugcPost, 'UGC post created successfully');
  } catch (error) {
    console.error('Failed to create UGC post:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to create UGC post', 500);
  }
} 