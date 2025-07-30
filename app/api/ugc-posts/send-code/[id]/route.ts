import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch the UGC post with influencer details
    const ugcPost = await prisma.ugcPost.findUnique({
      where: { id },
      include: {
        influencer: true,
      },
    });

    if (!ugcPost) {
      return NextResponse.json(
        { error: 'UGC post not found' },
        { status: 404 }
      );
    }

    // In production, this would:
    // 1. Generate a unique discount code
    // 2. Send it to the influencer via social media DM (Instagram/TikTok API)
    // 3. Update the UGC post status to rewarded
    console.log('Sending discount code via DM for UGC post:', {
      postId: id,
      platform: ugcPost.platform,
      influencer: ugcPost.influencer?.name,
      influencerHandle: ugcPost.platform === 'INSTAGRAM' 
        ? ugcPost.influencer?.instagramHandle 
        : ugcPost.influencer?.tiktokHandle
    });

    // Update the post status to rewarded
    await prisma.ugcPost.update({
      where: { id },
      data: { isRewarded: true }
    });

    return NextResponse.json({ 
      success: true,
      message: `Discount code sent successfully via ${ugcPost.platform} DM`
    });
  } catch (error) {
    console.error('Failed to send discount code via DM:', error);
    return NextResponse.json(
      { error: 'Failed to send discount code via DM' },
      { status: 500 }
    );
  }
} 