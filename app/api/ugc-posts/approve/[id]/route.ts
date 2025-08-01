import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify';
import { generateDiscountLink } from '@/utils/discount-links';
import { checkUsageLimit } from '@/utils/subscription';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { autoReward = false, rewardAmount, rewardType = 'PERCENTAGE' } = body;

    // Get the UGC post with influencer details
    const ugcPost = await prisma.ugcPost.findUnique({
      where: { id },
      include: {
        influencer: true,
        merchant: {
          select: { shop: true, accessToken: true }
        },
        discountCodes: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!ugcPost) {
      return NextResponse.json({ error: 'UGC post not found' }, { status: 404 });
    }

    // Check if already approved
    if (ugcPost.isApproved) {
      return NextResponse.json({ 
        error: 'UGC post is already approved',
        post: ugcPost 
      }, { status: 400 });
    }

    // Update post to approved status
    await prisma.ugcPost.update({
      where: { id },
      data: { 
        isApproved: true,
        updatedAt: new Date()
      }
    });

    console.log(`✅ UGC post ${id} approved`);

    // Handle automatic reward generation
    if (autoReward && ugcPost.influencer) {
      try {
        // Check usage limits
        const limitCheck = await checkUsageLimit(ugcPost.merchantId, 'ugc');
        if (!limitCheck.allowed) {
          console.warn(`UGC limit exceeded for merchant ${ugcPost.merchantId}`);
          return NextResponse.json({
            success: true,
            message: 'Post approved but reward generation skipped due to usage limits',
            post: { ...ugcPost, isApproved: true }
          });
        }

        // Generate reward based on engagement and settings
        const calculatedReward = calculateRewardAmount(ugcPost.engagement, rewardAmount);
        
        // Create discount code
        const discountCode = await createRewardDiscountCode(ugcPost, calculatedReward, rewardType);
        
        // Mark as rewarded
        await prisma.ugcPost.update({
          where: { id },
          data: { 
            isRewarded: true,
            rewardAmount: Math.round(calculatedReward * 100) // Store in cents
          }
        });

        console.log(`✅ Automatic reward generated for UGC post ${id}: ${discountCode.code}`);

        return NextResponse.json({
          success: true,
          message: 'Post approved and automatic reward generated',
          post: { ...ugcPost, isApproved: true, isRewarded: true },
          reward: {
            code: discountCode.code,
            amount: calculatedReward,
            type: rewardType
          }
        });

      } catch (rewardError) {
        console.error('Failed to generate automatic reward:', rewardError);
        return NextResponse.json({
          success: true,
          message: 'Post approved but reward generation failed',
          post: { ...ugcPost, isApproved: true },
          error: 'Reward generation failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'UGC post approved successfully',
      post: { ...ugcPost, isApproved: true }
    });

  } catch (error) {
    console.error('Failed to approve UGC post:', error);
    return NextResponse.json(
      { error: 'Failed to approve UGC post' },
      { status: 500 }
    );
  }
}

// Calculate reward amount based on engagement
function calculateRewardAmount(engagement: number, baseAmount?: number): number {
  if (baseAmount) return baseAmount;
  
  // Dynamic reward calculation based on engagement
  if (engagement >= 10000) return 50; // High engagement: $50
  if (engagement >= 5000) return 30;  // Medium-high: $30
  if (engagement >= 1000) return 20;  // Medium: $20
  if (engagement >= 500) return 15;   // Low-medium: $15
  return 10; // Low engagement: $10
}

// Create reward discount code
async function createRewardDiscountCode(ugcPost: unknown, rewardAmount: number, rewardType: string) {
  const merchant = (ugcPost as any).merchant;
  
  // Generate unique discount code
  const code = generateDiscountLink(
    `${(ugcPost as any).influencer?.name || 'UGC'}-${Date.now()}`, 
    { website: merchant.shopDomain }
  );

  let shopifyPriceRuleId = null;

  // Create real Shopify discount code if access token is available
  if (merchant.accessToken) {
    try {
      const shopifyAPI = new ShopifyAPI(merchant.accessToken, merchant.shop);
      const shopifyDiscount = await shopifyAPI.createDiscountCode(
        code,
        rewardType === 'PERCENTAGE' ? 'percentage' : 'fixed_amount',
        rewardAmount,
        1, // One-time use for UGC rewards
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
      );
      shopifyPriceRuleId = shopifyDiscount.id.toString();
      console.log(`Created Shopify discount code for UGC reward: ${code}`);
    } catch (error) {
      console.error('Failed to create Shopify discount code for UGC reward:', error);
    }
  }

  // Create discount code in database
  const discountCode = await prisma.discountCode.create({
    data: {
      merchantId: (ugcPost as any).merchantId,
      influencerId: (ugcPost as any).influencerId,
      ugcPostId: (ugcPost as any).id,
      code,
      codeType: 'INFLUENCER',
      discountType: rewardType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
      discountValue: rewardAmount,
      usageLimit: 1, // One-time use for UGC rewards
      usageCount: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      shopifyPriceRuleId,
    },
  });

  return discountCode;
} 