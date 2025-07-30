import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params: { id: string } }: { params: { id: string } }
) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    // const { id } = params; // Use the id parameter - not needed for this endpoint
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { influencerId, discountCodeId } = body;

    // Get the discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: discountCodeId },
    });

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Get the influencer details
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    // In a real implementation, you would send an email here
    // For demo purposes, we'll just log the email details
    console.log('Sending discount code email:', {
      to: influencer.email,
      subject: 'Your Discount Code is Ready!',
      discountCode: discountCode.code,
      discountValue: discountCode.discountValue,
      discountType: discountCode.discountType,
      uniqueLink: `https://demostore.com/discount/${discountCode.code}`,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Discount code email sent successfully' 
    });
  } catch (error) {
    console.error('Send discount code email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 