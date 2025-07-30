import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Prevent database connections during build time
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status'); // processed, unprocessed
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get merchant
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant found' }, { status: 404 });
    }

    // Build where clause
    const where: Record<string, unknown> = {
      merchantId: merchant.id,
    };

    if (platform) {
      where.platform = platform;
    }

    if (status === 'processed') {
      where.isProcessed = true;
    } else if (status === 'unprocessed') {
      where.isProcessed = false;
    }

    // Get brand mentions
    const [mentions, total] = await Promise.all([
      prisma.brandMention.findMany({
        where,
        include: {
          socialMediaAccount: {
            select: {
              username: true,
              displayName: true,
            },
          },
          discountCodes: {
            select: {
              code: true,
              usageCount: true,
              usageLimit: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.brandMention.count({ where }),
    ]);

    // Get summary stats
    const stats = await prisma.brandMention.groupBy({
      by: ['platform', 'isInfluencer', 'isProcessed'],
      where: { merchantId: merchant.id },
      _count: {
        id: true,
      },
    });

    const summary = {
      total: total,
      byPlatform: {} as Record<string, number>,
      byType: {
        influencers: 0,
        randomPeople: 0,
      },
      byStatus: {
        processed: 0,
        unprocessed: 0,
      },
    };

    stats.forEach(stat => {
      const platform = stat.platform;
      if (!summary.byPlatform[platform]) {
        summary.byPlatform[platform] = 0;
      }
      summary.byPlatform[platform] += stat._count.id;

      if (stat.isInfluencer) {
        summary.byType.influencers += stat._count.id;
      } else {
        summary.byType.randomPeople += stat._count.id;
      }

      if (stat.isProcessed) {
        summary.byStatus.processed += stat._count.id;
      } else {
        summary.byStatus.unprocessed += stat._count.id;
      }
    });

    return NextResponse.json({
      success: true,
      mentions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    console.error('Failed to get brand mentions:', error);
    return NextResponse.json({ error: 'Failed to get brand mentions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platform,
      mentionId,
      username,
      displayName,
      profilePictureUrl,
      postId,
      postUrl,
      content,
      mediaUrls,
      engagement,
      isInfluencer,
    } = body as {
      platform: string;
      mentionId: string;
      username: string;
      displayName?: string;
      profilePictureUrl?: string;
      postId: string;
      postUrl: string;
      content?: string;
      mediaUrls: string[];
      engagement: number;
      isInfluencer: boolean;
    };

    // Get merchant
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant found' }, { status: 404 });
    }

    // Get social media account for this platform
    const socialMediaAccount = await prisma.socialMediaAccount.findFirst({
      where: {
        merchantId: merchant.id,
        platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER',
      },
    });

    if (!socialMediaAccount) {
      return NextResponse.json({ error: `No ${platform} account connected` }, { status: 404 });
    }

    // Create brand mention
    const brandMention = await prisma.brandMention.create({
      data: {
        merchantId: merchant.id,
        socialMediaAccountId: socialMediaAccount.id,
        platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER',
        mentionId,
        username,
        displayName,
        profilePictureUrl,
        postId,
        postUrl,
        content,
        mediaUrls,
        engagement,
        isInfluencer,
        isProcessed: false,
        dmSent: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Brand mention created successfully',
      mention: brandMention,
    });
  } catch (error) {
    console.error('Failed to create brand mention:', error);
    return NextResponse.json({ error: 'Failed to create brand mention' }, { status: 500 });
  }
} 