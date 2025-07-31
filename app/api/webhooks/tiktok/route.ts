import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = request.headers;
    
    console.log('TikTok webhook received:', {
      headers: Object.fromEntries(headers.entries()),
      bodyLength: body.length,
    });

    // Parse the webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse TikTok webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('TikTok webhook data:', webhookData);

    // Handle different webhook event types
    switch (webhookData.event_type) {
      case 'user_info_update':
        // Handle user profile updates
        console.log('User info update received:', webhookData.data);
        break;

      case 'video_upload':
        // Handle new video uploads
        console.log('Video upload received:', webhookData.data);
        break;

      case 'comment_create':
        // Handle new comments
        console.log('Comment created:', webhookData.data);
        break;

      case 'like_create':
        // Handle new likes
        console.log('Like created:', webhookData.data);
        break;

      default:
        console.log('Unhandled webhook event type:', webhookData.event_type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TikTok webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification endpoint
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    console.log('TikTok webhook verification challenge:', challenge);
    return new NextResponse(challenge, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ message: 'TikTok webhook endpoint is active' });
} 