import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Soft delete the merchant (mark as inactive)
    await prisma.merchant.update({
      where: { shop },
      data: { isActive: false },
    });

    // Cancel any active subscriptions
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: { subscription: true },
    });

    if (merchant?.subscription) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: { status: 'CANCELED' },
      });
    }

    console.log(`App uninstalled for shop: ${shop}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('App uninstalled webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 