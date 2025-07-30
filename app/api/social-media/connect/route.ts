import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstagramAPI } from '@/lib/instagram';
import { TikTokAPI } from '@/lib/tiktok';

export async function POST(request: NextRequest) {
  try {
    const { platform, accessToken, accountId, username, displayName } = await request.json();

    if (!platform || !accessToken || !accountId || !username) {
      return NextResponse.json({ 
        error: 'Missing required fields: platform, accessToken, accountId, username' 
      }, { status: 400 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant found' }, { status: 404 });
    }

    // Generate webhook secret
    const webhookSecret = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);

    // Verify the account and get additional info
    let accountInfo;
    try {
      if (platform === 'INSTAGRAM') {
        const instagramAPI = new InstagramAPI({
          accessToken,
          businessAccountId: accountId,
          webhookVerifyToken: webhookSecret,
        });
        accountInfo = await instagramAPI.getBusinessAccount();
      } else if (platform === 'TIKTOK') {
        const tiktokAPI = new TikTokAPI({
          accessToken,
          businessAccountId: accountId,
          webhookVerifyToken: webhookSecret,
        });
        accountInfo = await tiktokAPI.getBusinessAccount();
      } else {
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
      }
    } catch (error) {
      console.error(`Failed to verify ${platform} account:`, error);
      return NextResponse.json({ 
        error: `Failed to verify ${platform} account. Please check your credentials.` 
      }, { status: 400 });
    }

    // Create or update social media account
    const socialMediaAccount = await prisma.socialMediaAccount.upsert({
      where: {
        merchantId_platform: {
          merchantId: merchant.id,
          platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER',
        },
      },
      update: {
        accountId,
        username,
        displayName: displayName || accountInfo?.name,
        accessToken, // In production, this should be encrypted
        webhookSecret,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        merchantId: merchant.id,
        platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER',
        accountId,
        username,
        displayName: displayName || accountInfo?.name,
        accessToken, // In production, this should be encrypted
        webhookSecret,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    // Subscribe to webhooks
    const webhookUrl = `${process.env.HOST || 'http://localhost:3000'}/api/webhooks/${platform.toLowerCase()}`;
    
    try {
      if (platform === 'INSTAGRAM') {
        const instagramAPI = new InstagramAPI({
          accessToken,
          businessAccountId: accountId,
          webhookVerifyToken: webhookSecret,
        });
        await instagramAPI.subscribeToWebhooks(webhookUrl);
      } else if (platform === 'TIKTOK') {
        const tiktokAPI = new TikTokAPI({
          accessToken,
          businessAccountId: accountId,
          webhookVerifyToken: webhookSecret,
        });
        await tiktokAPI.subscribeToWebhooks(webhookUrl);
      }
    } catch (error) {
      console.error(`Failed to subscribe to ${platform} webhooks:`, error);
      // Don't fail the connection, just log the error
    }

    return NextResponse.json({
      success: true,
      message: `${platform} account connected successfully`,
      account: {
        id: socialMediaAccount.id,
        platform: socialMediaAccount.platform,
        username: socialMediaAccount.username,
        displayName: socialMediaAccount.displayName,
        isActive: socialMediaAccount.isActive,
      },
    });
  } catch (error) {
    console.error('Social media connection error:', error);
    return NextResponse.json({ error: 'Failed to connect social media account' }, { status: 500 });
  }
} 