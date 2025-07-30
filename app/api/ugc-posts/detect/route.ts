import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platform,
      postUrl,
      postId,
      content,
      mediaUrls,
      engagement,
      influencerHandle,
      influencerName,
      influencerEmail
    } = body;

    // Get merchant (assuming first merchant for demo)
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      return NextResponse.json(
        { error: 'No merchant found' },
        { status: 404 }
      );
    }

    // Default settings for demo
    const currentSettings = {
      autoApprove: false,
      minEngagement: 100,
      codeDelayHours: 2,
      codeDelayMinutes: 0,
      maxCodesPerDay: 50,
      maxCodesPerInfluencer: 1,
      discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discountValue: 20,
      discountUsageLimit: 100
    };

    // Check if influencer exists, create if not
    let influencer = await prisma.influencer.findFirst({
      where: {
        merchantId: merchant.id,
        OR: [
          { email: influencerEmail },
          { instagramHandle: influencerHandle },
          { tiktokHandle: influencerHandle }
        ]
      }
    });

    if (!influencer) {
      influencer = await prisma.influencer.create({
        data: {
          merchantId: merchant.id,
          name: influencerName,
          email: influencerEmail,
          instagramHandle: platform === 'INSTAGRAM' ? influencerHandle : null,
          tiktokHandle: platform === 'TIKTOK' ? influencerHandle : null,
          commissionRate: 0.1
        }
      });
    }

    // Check engagement threshold
    if (engagement < currentSettings.minEngagement) {
      return NextResponse.json({
        success: false,
        message: 'Engagement below threshold',
        reason: 'low_engagement'
      });
    }

    // Check daily code limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const codesSentToday = await prisma.discountCode.count({
      where: {
        merchantId: merchant.id,
        createdAt: {
          gte: today
        }
      }
    });

    if (codesSentToday >= currentSettings.maxCodesPerDay) {
      return NextResponse.json({
        success: false,
        message: 'Daily code limit reached',
        reason: 'daily_limit'
      });
    }

    // Check influencer 24h limit
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const codesSentToInfluencer = await prisma.discountCode.count({
      where: {
        merchantId: merchant.id,
        influencerId: influencer.id,
        createdAt: {
          gte: yesterday
        }
      }
    });

    if (codesSentToInfluencer >= currentSettings.maxCodesPerInfluencer) {
      return NextResponse.json({
        success: false,
        message: 'Influencer limit reached (24h)',
        reason: 'influencer_limit'
      });
    }

    // Create UGC post
    const ugcPost = await prisma.ugcPost.create({
      data: {
        merchantId: merchant.id,
        platform,
        postUrl,
        postId,
        content,
        mediaUrls,
        engagement,
        isApproved: currentSettings.autoApprove,
        isRewarded: false,
        influencerId: influencer.id
      }
    });

    // If auto-approve is enabled, schedule code delivery
    if (currentSettings.autoApprove) {
      const delayMs = (currentSettings.codeDelayHours * 60 * 60 * 1000) + 
                     (currentSettings.codeDelayMinutes * 60 * 1000);
      
      // Schedule the code delivery
      setTimeout(async () => {
        try {
          const uniqueCode = generateUniqueCode(influencer.name, currentSettings.discountValue);
          
          // Generate and send discount code
          const discountCode = await prisma.discountCode.create({
            data: {
              merchantId: merchant.id,
              influencerId: influencer.id,
              ugcPostId: ugcPost.id,
              code: uniqueCode,
              uniqueLink: `https://demostore.com/discount/${uniqueCode}`,
              discountType: currentSettings.discountType,
              discountValue: currentSettings.discountValue,
              usageCount: 0,
              usageLimit: currentSettings.discountUsageLimit
            }
          });

          // Send via social media DM
          await sendCodeViaDM(platform, influencerHandle || '', discountCode.code, ugcPost.content || '');

          // Update UGC post status
          await prisma.ugcPost.update({
            where: { id: ugcPost.id },
            data: { isRewarded: true }
          });

          console.log(`Code sent via ${platform} DM to ${influencerHandle}`);
        } catch (error) {
          console.error('Failed to send scheduled code:', error);
        }
      }, delayMs);

      return NextResponse.json({
        success: true,
        message: `UGC post detected and approved. Code will be sent in ${currentSettings.codeDelayHours}h ${currentSettings.codeDelayMinutes}m`,
        postId: ugcPost.id,
        scheduled: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'UGC post detected, awaiting manual approval',
      postId: ugcPost.id,
      scheduled: false
    });

  } catch (error) {
    console.error('Failed to detect UGC post:', error);
    return NextResponse.json(
      { error: 'Failed to process UGC post' },
      { status: 500 }
    );
  }
}

function generateUniqueCode(influencerName: string, discountValue: number): string {
  const firstName = influencerName.split(' ')[0].toUpperCase();
  const lastName = influencerName.split(' ')[1]?.toUpperCase() || '';
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${firstName}${lastName}${discountValue}${random}`;
}

async function sendCodeViaDM(platform: string, handle: string, code: string, content: string) {
  // In production, this would integrate with Instagram/TikTok APIs
  console.log(`Sending code ${code} via ${platform} DM to @${handle}`);
  console.log(`Post content: ${content}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
} 