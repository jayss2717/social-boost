import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop') || 'teststorev103.myshopify.com';

    console.log(`🔍 Checking Shopify context for ${shop}`);

    // Get headers that might indicate Shopify context
    const headers = {
      'x-shopify-shop-domain': request.headers.get('x-shopify-shop-domain'),
      'x-shopify-api-version': request.headers.get('x-shopify-api-version'),
      'x-shopify-webhook-id': request.headers.get('x-shopify-webhook-id'),
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
    };

    const result = {
      success: true,
      message: 'Shopify context check completed',
      shop,
      headers,
      recommendations: [],
    };

    // Check for Shopify-specific headers
    if (!headers['x-shopify-shop-domain']) {
      result.recommendations.push('No Shopify shop domain header found');
    }

    if (!headers['x-shopify-api-version']) {
      result.recommendations.push('No Shopify API version header found');
    }

    // Check user agent for Shopify indicators
    if (headers['user-agent'] && headers['user-agent'].includes('Shopify')) {
      console.log('✅ Shopify user agent detected');
    } else {
      result.recommendations.push('No Shopify user agent detected');
    }

    // Check referer for Shopify admin
    if (headers['referer'] && headers['referer'].includes('myshopify.com')) {
      console.log('✅ Shopify referer detected');
    } else {
      result.recommendations.push('No Shopify referer detected');
    }

    console.log('🔍 Shopify context check results:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Shopify context check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Shopify context' },
      { status: 500 }
    );
  }
} 