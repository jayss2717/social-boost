import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discountCodeId = params.id;

    try {
      // Check if discount code exists and belongs to the merchant
      const existingDiscountCode = await prisma.discountCode.findFirst({
        where: {
          id: discountCodeId,
          merchantId,
        },
      });

      if (!existingDiscountCode) {
        return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
      }

      // Delete the discount code
      await prisma.discountCode.delete({
        where: {
          id: discountCodeId,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Discount code deleted successfully' 
      });
    } catch (dbError) {
      console.error('Database error in delete discount code:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
  } catch (error) {
    console.error('Delete discount code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const influencerId = params.id;

    // Verify the influencer belongs to this merchant
    const influencer = await prisma.influencer.findFirst({
      where: {
        id: influencerId,
        merchantId: merchantId,
      },
    });

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    // Get discount codes for this influencer
    const discountCodes = await prisma.discountCode.findMany({
      where: {
        influencerId: influencerId,
        merchantId: merchantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch merchant settings for link generation
    const merchantSettings = await prisma.merchantSettings.findUnique({
      where: { merchantId },
      select: { website: true, linkPattern: true },
    });

    // Add unique links to all discount codes
    const discountCodesWithLinks = discountCodes.map((code) => ({
      ...code,
      uniqueLink: generateDiscountLink(code.code, merchantSettings ? {
        website: merchantSettings.website || undefined,
        linkPattern: merchantSettings.linkPattern
      } : undefined),
    }));

    return NextResponse.json(discountCodesWithLinks);
  } catch (error) {
    console.error('Discount codes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate discount links
function generateDiscountLink(code: string, settings?: { website?: string; linkPattern?: string }) {
  if (!settings?.website) {
    return null;
  }

  const pattern = settings.linkPattern || '/discount/{code}';
  return `${settings.website}${pattern.replace('{code}', code)}`;
} 