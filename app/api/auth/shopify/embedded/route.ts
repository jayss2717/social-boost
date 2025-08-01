import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    console.log('🔐 Embedded OAuth triggered:', { shop, host });

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Validate shop domain
    if (!shop.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]\.myshopify\.com$/)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // For embedded apps, we need to redirect to the OAuth flow
    // The host parameter is used for the final redirect back to Shopify
    const scopes = 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products';
    const redirectUri = `https://socialboost-blue.vercel.app/api/auth/shopify/callback`;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${encodeURIComponent(host || '')}`;

    console.log('🔄 Redirecting to OAuth:', authUrl);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Shopify embedded auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 