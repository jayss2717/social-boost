import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstagramAPI } from '@/lib/instagram';

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

    const instagramAccount = merchant.socialMediaAccounts.find(
      account => account.platform === 'INSTAGRAM'
    );

    if (!instagramAccount) {
      return NextResponse.json({ error: 'No Instagram account connected' }, { status: 404 });
    }

    // Verify webhook
    if (mode === 'subscribe' && token === instagramAccount.webhookSecret) {
      console.log('Instagram webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
  } catch (error) {
    console.error('Instagram webhook verification error:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Instagram webhook received:', JSON.stringify(body, null, 2));

    // Get merchant and Instagram account
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
      include: { 
        socialMediaAccounts: true,
        settings: true,
      },
    });

    if (!merchant) {
      console.log('No active merchant found for Instagram webhook');
      return NextResponse.json({ success: true });
    }

    const instagramAccount = merchant.socialMediaAccounts.find(
      account => account.platform === 'INSTAGRAM'
    );

    if (!instagramAccount) {
      console.log('No Instagram account connected for webhook');
      return NextResponse.json({ success: true });
    }

    // Initialize Instagram API
    const instagramAPI = new InstagramAPI({
      accessToken: instagramAccount.accessToken,
      businessAccountId: instagramAccount.accountId,
      webhookVerifyToken: instagramAccount.webhookSecret || '',
    });

    // Process webhook event
    await instagramAPI.processWebhookEvent(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Instagram webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 