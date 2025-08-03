import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Generate OAuth URL
    const nonce = Math.random().toString(36).substring(2, 15);
    const scopes = 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products';
    const redirectUri = `https://socialboost-blue.vercel.app/api/auth/shopify/callback`;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${nonce}`;

    console.log('🔐 Manual OAuth trigger for shop:', shop);
    console.log('🔐 OAuth URL:', authUrl);

    return NextResponse.json({
      success: true,
      shop,
      authUrl,
      message: 'OAuth URL generated. Visit this URL to complete OAuth.',
    });
  } catch (error) {
    console.error('Manual OAuth trigger error:', error);
    return NextResponse.json({ error: 'OAuth trigger failed' }, { status: 500 });
  }
} 