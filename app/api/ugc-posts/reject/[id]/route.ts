import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reason = 'other' } = body;

    // Get the UGC post
    const ugcPost = await prisma.ugcPost.findUnique({
      where: { id },
      include: {
        influencer: true,
      }
    });

    if (!ugcPost) {
      return NextResponse.json({ error: 'UGC post not found' }, { status: 404 });
    }

    // Check if already processed
    if (ugcPost.isApproved || ugcPost.isRewarded) {
      return NextResponse.json({ 
        error: 'UGC post has already been processed',
        post: ugcPost 
      }, { status: 400 });
    }

    // Update post to rejected status
    await prisma.ugcPost.update({
      where: { id },
      data: { 
        isApproved: false,
        isRewarded: false,
        updatedAt: new Date()
      }
    });

    // Log rejection for analytics
    await prisma.ugcRejection.create({
      data: {
        ugcPostId: id,
        merchantId: ugcPost.merchantId,
        reason,
        influencerId: ugcPost.influencerId,
        platform: ugcPost.platform,
        engagement: ugcPost.engagement,
      }
    });

    console.log(`❌ UGC post ${id} rejected with reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'UGC post rejected successfully',
      post: { ...ugcPost, isApproved: false, isRewarded: false }
    });

  } catch (error) {
    console.error('Failed to reject UGC post:', error);
    return NextResponse.json(
      { error: 'Failed to reject UGC post' },
      { status: 500 }
    );
  }
} 