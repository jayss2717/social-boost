import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('TikTok OAuth error:', error);
      return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_missing_params`);
    }

    // Decode state parameter
    let merchantId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      merchantId = stateData.merchantId;
    } catch (error) {
      console.error('Failed to decode state parameter:', error);
      return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_invalid_state`);
    }

    // TikTok OAuth configuration
    const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
    const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
    const REDIRECT_URI = `${process.env.HOST}/api/auth/tiktok/callback`;

    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_not_configured`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('TikTok token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, open_id } = tokenData.data;

    // Fetch user information
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch TikTok user data:', await userResponse.text());
      return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_user_failed`);
    }

    const userData = await userResponse.json();
    const userInfo = userData.data.user;

    // Save or update social media account
    const socialMediaAccount = await prisma.socialMediaAccount.upsert({
      where: {
        merchantId_platform: {
          merchantId,
          platform: 'TIKTOK',
        },
      },
      update: {
        accountId: open_id,
        username: userInfo.username,
        displayName: userInfo.display_name,
        accessToken: access_token,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        merchantId,
        platform: 'TIKTOK',
        accountId: open_id,
        username: userInfo.username,
        displayName: userInfo.display_name,
        accessToken: access_token,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    console.log('TikTok account connected successfully:', {
      merchantId,
      username: userInfo.username,
      accountId: open_id,
    });

    // Redirect back to settings with success message
    return NextResponse.redirect(`${process.env.HOST}/settings?success=tiktok_connected`);
  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.redirect(`${process.env.HOST}/settings?error=tiktok_callback_failed`);
  }
} 