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