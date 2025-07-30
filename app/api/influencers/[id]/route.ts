import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { influencerSchema, createErrorResponse, createSuccessResponse } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = requireMerchantId(request);
    const influencerId = params.id;

    const body = await request.json();
    const validatedData = influencerSchema.parse(body);

    // Check if influencer exists and belongs to this merchant
    const existingInfluencer = await prisma.influencer.findFirst({
      where: {
        id: influencerId,
        merchantId,
      },
    });

    if (!existingInfluencer) {
      return createErrorResponse('Influencer not found', 404);
    }

    // Check if updated email/handles conflict with other influencers
    const conflictingInfluencer = await prisma.influencer.findFirst({
      where: {
        merchantId,
        id: { not: influencerId },
        OR: [
          { email: validatedData.email },
          { instagramHandle: validatedData.instagramHandle },
          { tiktokHandle: validatedData.tiktokHandle },
        ].filter(Boolean),
      },
    });

    if (conflictingInfluencer) {
      return createErrorResponse('Another influencer already exists with this email or social media handle', 409);
    }

    const updatedInfluencer = await prisma.influencer.update({
      where: {
        id: influencerId,
      },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        instagramHandle: validatedData.instagramHandle,
        tiktokHandle: validatedData.tiktokHandle,
        commissionRate: validatedData.commissionRate,
      },
      include: {
        discountCodes: true,
        payouts: true,
      },
    });

    return createSuccessResponse(updatedInfluencer, 'Influencer updated successfully');
  } catch (error) {
    console.error('Failed to update influencer:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to update influencer', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = requireMerchantId(request);
    const influencerId = params.id;

    // Check if influencer exists and belongs to this merchant
    const existingInfluencer = await prisma.influencer.findFirst({
      where: {
        id: influencerId,
        merchantId,
      },
    });

    if (!existingInfluencer) {
      return createErrorResponse('Influencer not found', 404);
    }

    // Delete related records first
    await prisma.discountCode.deleteMany({
      where: {
        influencerId: influencerId,
      },
    });

    await prisma.payout.deleteMany({
      where: {
        influencerId: influencerId,
      },
    });

    // Delete the influencer
    await prisma.influencer.delete({
      where: {
        id: influencerId,
      },
    });

    return createSuccessResponse(null, 'Influencer deleted successfully');
  } catch (error) {
    console.error('Failed to delete influencer:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to delete influencer', 500);
  }
} 