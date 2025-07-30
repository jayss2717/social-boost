import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Validate shop domain
    if (!shop.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]\.myshopify\.com$/)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Generate OAuth URL
    const nonce = Math.random().toString(36).substring(2, 15);
    const scopes = 'read_orders,write_discounts,read_products,read_customers,write_products,read_inventory,write_inventory,read_analytics,read_marketing_events,write_marketing_events';
    const redirectUri = `${process.env.HOST}/api/auth/shopify/callback`;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${nonce}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Shopify auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 