import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 });
    }

    // TikTok OAuth configuration
    const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
    const REDIRECT_URI = `${process.env.HOST}/api/auth/tiktok/callback`;

    if (!TIKTOK_CLIENT_KEY) {
      return NextResponse.json({ error: 'TikTok API not configured' }, { status: 503 });
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ merchantId })).toString('base64');

    // TikTok OAuth URL
    const authUrl = `https://www.tiktok.com/auth/authorize?` +
      `client_key=${TIKTOK_CLIENT_KEY}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=user.info.basic,video.list&` +
      `response_type=code&` +
      `state=${encodeURIComponent(state)}`;

    console.log('TikTok OAuth URL generated:', authUrl);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('TikTok auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 