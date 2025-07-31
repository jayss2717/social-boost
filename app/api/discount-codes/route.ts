import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { discountCodeSchema } from '@/utils/validation';
import { generateDiscountLink } from '@/utils/discount-links';

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

    try {
      // Get influencer details for code generation
      const influencer = await prisma.influencer.findUnique({
        where: { id: validatedData.influencerId },
      });

      if (!influencer) {
        return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
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

      // Fetch merchant settings for link generation
      const merchantSettings = await prisma.merchantSettings.findUnique({
        where: { merchantId },
        select: { website: true, linkPattern: true },
      });

      const discountCode = await prisma.discountCode.create({
        data: {
          ...validatedData,
          merchantId,
          code,
          codeType: 'INFLUENCER', // Manual creation is always for influencers
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
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