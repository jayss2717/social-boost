import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Get merchant settings for webhook verification
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
      include: { socialMediaAccounts: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant found' }, { status: 404 });
    }

    const tiktokAccount = merchant.socialMediaAccounts.find(
      account => account.platform === 'TIKTOK'
    );

    if (!tiktokAccount) {
      return NextResponse.json({ error: 'No TikTok account connected' }, { status: 404 });
    }

    // Verify webhook
    if (mode === 'subscribe' && token === tiktokAccount.webhookSecret) {
      console.log('TikTok webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
  } catch (error) {
    console.error('TikTok webhook verification error:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('TikTok webhook received:', JSON.stringify(body, null, 2));

    // Get merchant and TikTok account
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
      include: { 
        socialMediaAccounts: true,
        settings: true,
      },
    });

    if (!merchant) {
      console.log('No active merchant found for TikTok webhook');
      return NextResponse.json({ success: true });
    }

    const tiktokAccount = merchant.socialMediaAccounts.find(
      account => account.platform === 'TIKTOK'
    );

    if (!tiktokAccount) {
      console.log('No TikTok account connected for webhook');
      return NextResponse.json({ success: true });
    }

    // Initialize TikTok API
    const tiktokAPI = new TikTokAPI({
      accessToken: tiktokAccount.accessToken,
      businessAccountId: tiktokAccount.accountId,
      webhookVerifyToken: tiktokAccount.webhookSecret || '',
    });

    // Process webhook event
    await tiktokAPI.processWebhookEvent(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TikTok webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 