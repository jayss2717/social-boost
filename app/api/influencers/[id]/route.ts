import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { influencerSchema } from '@/utils/validation';
import { requireMerchantId } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/api';

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
    const { id: influencerId } = params;

    console.log('🗑️ Deleting influencer:', { influencerId, merchantId });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Delete operation timed out')), 10000);
    });

    // Verify influencer belongs to merchant
    const influencer = await prisma.influencer.findFirst({
      where: {
        id: influencerId,
        merchantId,
      },
      include: {
        discountCodes: true,
        payouts: true,
      },
    });

    if (!influencer) {
      console.log('❌ Influencer not found');
      return createErrorResponse('Influencer not found', 404);
    }

    console.log('🔍 Found influencer to delete:', {
      name: influencer.name,
      email: influencer.email,
      discountCodesCount: influencer.discountCodes.length,
      payoutsCount: influencer.payouts.length,
    });

    // Delete influencer and all related data (cascade delete)
    console.log('🗑️ Starting cascade delete for influencer:', influencerId);
    
    const deleteOperation = async () => {
      try {
        await prisma.influencer.delete({
          where: {
            id: influencerId,
          },
        });
        console.log('✅ Cascade delete completed successfully');
      } catch (deleteError) {
        console.error('❌ Cascade delete failed:', deleteError);
        
        // Fallback: Delete related records manually if cascade fails
        console.log('🔄 Attempting manual deletion...');
        
        await prisma.discountCode.deleteMany({
          where: { influencerId },
        });
        
        await prisma.payout.deleteMany({
          where: { influencerId },
        });
        
        await prisma.ugcPost.deleteMany({
          where: { influencerId },
        });
        
        await prisma.ugcRejection.deleteMany({
          where: { influencerId },
        });
        
        await prisma.influencer.delete({
          where: { id: influencerId },
        });
        
        console.log('✅ Manual deletion completed successfully');
      }
    };

    // Execute delete operation with timeout
    await Promise.race([deleteOperation(), timeoutPromise]);

    console.log('✅ Influencer deleted successfully');

    return createSuccessResponse(
      { influencerId },
      'Influencer deleted successfully'
    );
  } catch (error) {
    console.error('Failed to delete influencer:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    if (error instanceof Error && error.message === 'Delete operation timed out') {
      return createErrorResponse('Delete operation timed out. Please try again.', 408);
    }
    return createErrorResponse('Failed to delete influencer', 500);
  }
} 