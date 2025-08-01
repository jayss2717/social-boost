import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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
    const scopes = 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products';
    const redirectUri = `https://socialboost-blue.vercel.app/api/auth/shopify/callback`;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Return HTML that will redirect the parent window
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to OAuth...</title>
        </head>
        <body>
          <script>
            console.log('🔄 Redirecting parent window to OAuth...');
            window.parent.location.href = '${authUrl}';
          </script>
          <p>Redirecting to Shopify OAuth...</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Shopify embedded redirect error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 