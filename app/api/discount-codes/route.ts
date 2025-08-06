import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { discountCodeSchema } from '@/utils/validation';
import { generateDiscountLink } from '@/utils/discount-links';
import { ShopifyAPI } from '@/lib/shopify';
import { checkUsageLimit } from '@/utils/subscription';
import { checkMerchantAuth } from '@/utils/shopify';

// Generate unique discount code for influencers
function generateDiscountCode(influencerName: string, discountValue: number): string {
  const prefix = influencerName.split(' ')[0].toUpperCase();
  const lastName = influencerName.split(' ')[1]?.toUpperCase() || '';
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${lastName}${discountValue}${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    const influencerId = request.nextUrl.searchParams.get('influencerId');
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
    }

    try {
      const where: Record<string, unknown> = { merchantId };
      if (influencerId) {
        where.influencerId = influencerId;
      }

      // Fetch merchant settings for link generation
      const merchantSettings = await prisma.merchantSettings.findUnique({
        where: { merchantId },
        select: { website: true, linkPattern: true },
      });

      const discountCodes = await prisma.discountCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          influencer: {
            select: { name: true, email: true }
          }
        }
      });

      // Add unique links to all discount codes using merchant settings
      const discountCodesWithLinks = discountCodes.map((code) => ({
        ...code,
        uniqueLink: generateDiscountLink(code.code, merchantSettings ? {
          website: merchantSettings.website || undefined,
          linkPattern: merchantSettings.linkPattern
        } : undefined),
      }));

      return NextResponse.json(discountCodesWithLinks);
    } catch (dbError) {
      console.error('Database error in discount codes API:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
  } catch (error) {
    console.error('Discount codes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = discountCodeSchema.parse(body);

    // Check usage limits
    const usageCheck = await checkUsageLimit(merchantId, 'ugc');
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        current: usageCheck.current,
        limit: usageCheck.limit
      }, { status: 403 });
    }

    try {
      // Get merchant and influencer details
      const [merchant, influencer] = await Promise.all([
        prisma.merchant.findUnique({
          where: { id: merchantId },
          select: { shop: true, accessToken: true }
        }),
        prisma.influencer.findUnique({
          where: { id: validatedData.influencerId },
        })
      ]);

      if (!merchant || !influencer) {
        return NextResponse.json({ error: 'Merchant or influencer not found' }, { status: 404 });
      }

      // Validate Shopify access token before proceeding
      const authCheck = await checkMerchantAuth(merchantId);
      if (authCheck.needsReauth) {
        console.log('❌ Shopify authentication required for merchant:', merchantId);
        return NextResponse.json({ 
          error: 'Shopify authentication required',
          message: 'Your Shopify access token has expired. Please re-authenticate the app.',
          reauthUrl: authCheck.reauthUrl,
          needsReauth: true
        }, { status: 401 });
      }

      if (!merchant.accessToken) {
        return NextResponse.json({ error: 'Shopify access token not found' }, { status: 400 });
      }

      // Generate unique discount code
      let code = generateDiscountCode(influencer.name, validatedData.discountValue);
      let attempts = 0;
      
      // Ensure code is unique
      while (attempts < 10) {
        const existingCode = await prisma.discountCode.findFirst({
          where: { code },
        });
        
        if (!existingCode) break;
        
        code = generateDiscountCode(influencer.name, validatedData.discountValue);
        attempts++;
      }

      // Create real discount code in Shopify
      const shopifyAPI = new ShopifyAPI(merchant.accessToken, merchant.shop);
      let shopifyPriceRuleId: string | null = null;

      try {
        const shopifyDiscount = await shopifyAPI.createDiscountCode(
          code,
          validatedData.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed_amount',
          validatedData.discountValue,
          validatedData.usageLimit,
          validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
        );
        shopifyPriceRuleId = shopifyDiscount.id.toString();
        console.log(`Created Shopify discount code: ${code} with ID: ${shopifyPriceRuleId}`);
      } catch (shopifyError) {
        console.error('Failed to create Shopify discount code:', shopifyError);
        
        // Check if it's an authentication error
        if (shopifyError instanceof Error && shopifyError.message.includes('invalid')) {
          return NextResponse.json({ 
            error: 'Shopify authentication required',
            message: 'Your Shopify access token has expired. Please re-authenticate the app.',
            reauthUrl: authCheck.reauthUrl,
            needsReauth: true
          }, { status: 401 });
        }
        
        return NextResponse.json({ 
          error: 'Failed to create discount code in Shopify',
          details: shopifyError instanceof Error ? shopifyError.message : 'Unknown error'
        }, { status: 500 });
      }

      // Fetch merchant settings for link generation
      const merchantSettings = await prisma.merchantSettings.findUnique({
        where: { merchantId },
        select: { website: true, linkPattern: true },
      });

      // Create discount code in database
      const discountCode = await prisma.discountCode.create({
        data: {
          ...validatedData,
          merchantId,
          code,
          codeType: 'INFLUENCER',
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
          shopifyPriceRuleId, // Store Shopify price rule ID for future reference
        },
      });

      // Add unique link to the response using merchant settings
      const discountCodeWithLink = {
        ...discountCode,
        uniqueLink: generateDiscountLink(code, merchantSettings ? {
          website: merchantSettings.website || undefined,
          linkPattern: merchantSettings.linkPattern
        } : undefined),
      };

      return NextResponse.json(discountCodeWithLink);
    } catch (dbError) {
      console.error('Database error in create discount code:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
  } catch (error) {
    console.error('Create discount code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 