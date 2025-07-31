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

    // Instagram OAuth configuration
    const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
    const REDIRECT_URI = `${process.env.HOST}/api/auth/instagram/callback`;

    if (!INSTAGRAM_CLIENT_ID) {
      return NextResponse.json({ error: 'Instagram API not configured' }, { status: 503 });
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ merchantId })).toString('base64');

    // Instagram OAuth URL
    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=basic,comments,relationships&` +
      `response_type=code&` +
      `state=${encodeURIComponent(state)}`;

    console.log('Instagram OAuth URL generated:', authUrl);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Instagram auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 