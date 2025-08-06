import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCommission } from '@/utils/payouts';
import { createPayout } from '@/utils/payouts';

// Define proper types for the order data
interface ShopifyOrder {
  id: string;
  total_price: string;
  discount_codes?: Array<{
    code: string;
    amount: string;
  }>;
}

interface ShopifyDiscountCode {
  code: string;
  amount: string;
}

interface MerchantWithSettings {
  id: string;
  shop: string;
  merchantSettings?: {
    commissionSettings?: {
      commissionCalculationBase?: 'DISCOUNTED_AMOUNT' | 'ORIGINAL_AMOUNT';
    };
    payoutSettings?: {
      autoPayout?: boolean;
      minimumPayoutAmount?: number;
    };
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-shopify-hmac-sha256');

  if (!signature) {
    console.error('Missing Shopify webhook signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  try {
    // Verify webhook signature (implement proper verification)
    const order: ShopifyOrder = JSON.parse(body);
    console.log('Processing order webhook:', order.id);

    // Extract shop domain from webhook
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    if (!shopDomain) {
      console.error('Missing shop domain in webhook');
      return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 });
    }

    // Find merchant by shop domain
    const merchant = await prisma.merchant.findFirst({
      where: { shop: shopDomain },
      include: {
        merchantSettings: true,
      },
    });

    if (!merchant) {
      console.error('Merchant not found for shop:', shopDomain);
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Process order for influencer commissions
    await processOrderForCommissions(order, merchant as MerchantWithSettings);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing order webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processOrderForCommissions(order: ShopifyOrder, merchant: MerchantWithSettings) {
  try {
    console.log('Processing order for commissions:', order.id);

    // Extract discount codes used in the order
    const discountCodes = order.discount_codes || [];
    
    if (discountCodes.length === 0) {
      console.log('No discount codes found in order:', order.id);
      return;
    }

    // Process each discount code
    for (const discountCode of discountCodes) {
      await processDiscountCodeForCommission(discountCode, order, merchant);
    }

  } catch (error) {
    console.error('Error processing order for commissions:', error);
  }
}

async function processDiscountCodeForCommission(discountCode: ShopifyDiscountCode, order: ShopifyOrder, merchant: MerchantWithSettings) {
  try {
    console.log('Processing discount code:', discountCode.code);

    // Find influencer by discount code
    const influencer = await prisma.influencer.findFirst({
      where: {
        merchantId: merchant.id,
        discountCodes: {
          some: {
            code: discountCode.code,
            isActive: true,
          },
        },
      },
      include: {
        discountCodes: {
          where: {
            code: discountCode.code,
            isActive: true,
          },
        },
      },
    });

    if (!influencer) {
      console.log('No influencer found for discount code:', discountCode.code);
      return;
    }

    console.log('Found influencer:', influencer.name, 'for code:', discountCode.code);

    // Calculate commission
    const originalAmount = parseFloat(order.total_price);
    const discountAmount = parseFloat(discountCode.amount);
    const discountedAmount = originalAmount - discountAmount;

    const commissionCalculationBase = merchant.merchantSettings?.commissionSettings?.commissionCalculationBase || 'DISCOUNTED_AMOUNT';

    const commissionResult = calculateCommission({
      originalAmount,
      discountedAmount,
      commissionRate: influencer.commissionRate,
      calculationBase: commissionCalculationBase,
    });

    console.log('Commission calculation:', {
      originalAmount,
      discountedAmount,
      commissionRate: influencer.commissionRate,
      calculationBase: commissionCalculationBase,
      commissionAmount: commissionResult.commissionAmount,
    });

    // Create payout record
    const payout = await createPayout({
      merchantId: merchant.id,
      influencerId: influencer.id,
      orderId: order.id.toString(),
      originalAmount,
      discountedAmount,
      commissionAmount: commissionResult.commissionAmount,
      commissionRate: influencer.commissionRate,
      discountCode: discountCode.code,
      status: 'PENDING',
    });

    console.log('Created payout:', payout.id, 'for amount:', commissionResult.commissionAmount);

    // Check if auto-payout should be triggered
    if (merchant.merchantSettings?.payoutSettings?.autoPayout) {
      const minimumAmount = merchant.merchantSettings.payoutSettings.minimumPayoutAmount || 0;
      
      if (commissionResult.commissionAmount >= minimumAmount) {
        console.log('Auto-payout criteria met, processing payout');
        await processPayoutViaStripe(payout.id);
      } else {
        console.log('Commission amount below minimum for auto-payout:', commissionResult.commissionAmount);
      }
    }

  } catch (error) {
    console.error('Error processing discount code for commission:', error);
  }
}

async function processPayoutViaStripe(payoutId: string) {
  try {
    // Get payout with influencer details
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        influencer: true,
      },
    });

    if (!payout || !payout.influencer.stripeAccountId) {
      console.error('Payout or Stripe account not found:', payoutId);
      return;
    }

    // Import Stripe
    const { stripe } = await import('@/lib/stripe');

    // Create transfer to influencer's Stripe account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.commissionAmount * 100), // Convert to cents
      currency: 'usd',
      destination: payout.influencer.stripeAccountId,
      description: `Commission for order ${payout.orderId} - ${payout.discountCode}`,
      metadata: {
        payoutId: payout.id,
        orderId: payout.orderId,
        influencerId: payout.influencerId,
        discountCode: payout.discountCode,
      },
    });

    // Update payout status
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        stripeTransferId: transfer.id,
        updatedAt: new Date(),
      },
    });

    console.log('Stripe transfer created:', transfer.id, 'for payout:', payoutId);

  } catch (error) {
    console.error('Error processing payout via Stripe:', error);
    
    // Update payout status to failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
} 