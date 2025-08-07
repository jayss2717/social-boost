import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    console.log(`🔍 Merchant API called with shop: ${shop}, host: ${host}`);
    console.log(`🔍 Request URL: ${request.url}`);
    console.log(`🔍 User Agent: ${request.headers.get('user-agent')}`);
    console.log(`🔍 Referer: ${request.headers.get('referer')}`);

    if (!shop && !host) {
      console.log(`❌ Missing shop and host parameters`);
      return NextResponse.json({ error: 'Missing shop or host parameter' }, { status: 400 });
    }

    // Use shop parameter if available, otherwise try to extract from host
    const shopDomain = shop || (host ? `${host.replace('.myshopify.com', '')}.myshopify.com` : null);
    
    if (!shopDomain) {
      console.log(`❌ Could not determine shop domain from shop: ${shop}, host: ${host}`);
      return NextResponse.json({ error: 'Could not determine shop domain' }, { status: 400 });
    }

    console.log(`🔍 Looking for merchant with shop: ${shopDomain}`);

    let merchant = await prisma.merchant.findUnique({
      where: { shop: shopDomain },
      include: {
        settings: true,
      },
    });

    if (merchant) {
      console.log(`✅ Found existing merchant: ${merchant.id} for shop: ${shopDomain}`);
      return NextResponse.json(merchant);
    }

    // Don't create merchant automatically - only during OAuth installation
    console.log(`❌ No merchant found for shop: ${shopDomain}`);
    console.log(`❌ This could be an uninstalled app or invalid request`);
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  } catch (error) {
    console.error('❌ Merchant API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 