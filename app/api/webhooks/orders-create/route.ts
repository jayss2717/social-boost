import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id: orderId, line_items, discount_codes, total_price, subtotal_price } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Find the merchant by order (you might need to store shop info with orders)
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
    });

    if (!merchant) {
      console.log('No active merchant found for order:', orderId);
      return NextResponse.json({ success: true });
    }

    // Check if any discount codes were used
    if (discount_codes && discount_codes.length > 0) {
      for (const discountCode of discount_codes) {
        const code = await prisma.discountCode.findFirst({
          where: {
            code: discountCode.code,
            merchantId: merchant.id,
          },
          include: { influencer: true },
        });

        if (code && code.influencer) {
          // Calculate commission based on discount amount
          const discountAmount = parseFloat(discountCode.amount);
          const commissionAmount = Math.round(discountAmount * code.influencer.commissionRate * 100); // Convert to cents

          // Create payout record
          await prisma.payout.create({
            data: {
              merchantId: merchant.id,
              influencerId: code.influencer.id,
              amount: commissionAmount,
              status: 'PENDING',
              periodStart: new Date(),
              periodEnd: new Date(),
              stripeTransferId: null,
            },
          });

          console.log(`Created payout for influencer ${code.influencer.name}: $${commissionAmount / 100}`);
        }
      }
    }

    console.log(`Order ${orderId} processed for shop: ${merchant.shop}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Orders create webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 