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
      console.error('Instagram OAuth error:', error);
      return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_missing_params`);
    }

    // Decode state parameter
    let merchantId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      merchantId = stateData.merchantId;
    } catch (error) {
      console.error('Failed to decode state parameter:', error);
      return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_invalid_state`);
    }

    // Instagram OAuth configuration
    const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
    const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
    const REDIRECT_URI = `${process.env.HOST}/api/auth/instagram/callback`;

    if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
      return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_not_configured`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Instagram token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, user_id } = tokenData;

    // Fetch user information
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${access_token}`);

    if (!userResponse.ok) {
      console.error('Failed to fetch Instagram user data:', await userResponse.text());
      return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_user_failed`);
    }

    const userData = await userResponse.json();

    // Save or update social media account
    await prisma.socialMediaAccount.upsert({
      where: {
        merchantId_platform: {
          merchantId,
          platform: 'INSTAGRAM',
        },
      },
      update: {
        accountId: user_id,
        username: userData.username,
        displayName: userData.username,
        accessToken: access_token,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        merchantId,
        platform: 'INSTAGRAM',
        accountId: user_id,
        username: userData.username,
        displayName: userData.username,
        accessToken: access_token,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    console.log('Instagram account connected successfully:', {
      merchantId,
      username: userData.username,
      accountId: user_id,
    });

    // Redirect back to settings with success message
    return NextResponse.redirect(`${process.env.HOST}/settings?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(`${process.env.HOST}/settings?error=instagram_callback_failed`);
  }
} 