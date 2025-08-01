import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShopifyAPI } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id: orderId, shop_domain, discount_codes, total_price, currency, customer } = body;

    console.log(`Processing order webhook for order ${orderId} from shop ${shop_domain}`);

    if (!orderId || !shop_domain) {
      return NextResponse.json({ error: 'Missing required order data' }, { status: 400 });
    }

    // Find the merchant by shop domain
    const merchant = await prisma.merchant.findFirst({
      where: { 
        shop: shop_domain,
        isActive: true 
      },
      include: {
        settings: true,
      }
    });

    if (!merchant) {
      console.log(`No active merchant found for shop: ${shop_domain}`);
      return NextResponse.json({ success: true });
    }

    // Get detailed order information from Shopify if access token is available
    if (merchant.accessToken) {
      try {
        const shopifyAPI = new ShopifyAPI(merchant.accessToken, merchant.shop);
        await shopifyAPI.getOrder(orderId);
        console.log(`Retrieved order details from Shopify for order ${orderId}`);
      } catch (error) {
        console.error(`Failed to get order details from Shopify:`, error);
        // Continue processing with webhook data only
      }
    }

    // Process discount codes if any were used
    if (discount_codes && discount_codes.length > 0) {
      console.log(`Processing ${discount_codes.length} discount codes for order ${orderId}`);
      
      for (const discountCode of discount_codes) {
        try {
          // Find the discount code in our database
          const code = await prisma.discountCode.findFirst({
            where: {
              code: discountCode.code,
              merchantId: merchant.id,
              isActive: true,
            },
            include: { 
              influencer: true,
              ugcPost: true,
            },
          });

          if (!code) {
            console.log(`Discount code ${discountCode.code} not found in database`);
            continue;
          }

          // Update usage count
          await prisma.discountCode.update({
            where: { id: code.id },
            data: { usageCount: { increment: 1 } },
          });

          console.log(`Updated usage count for discount code ${discountCode.code}`);

          // Calculate commission if influencer is associated
          if (code.influencer) {
            const discountAmount = parseFloat(discountCode.amount || '0');
            
            // Calculate commission based on discount amount and influencer's commission rate
            const commissionAmount = Math.round(discountAmount * code.influencer.commissionRate * 100); // Convert to cents

            if (commissionAmount > 0) {
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

              console.log(`Created payout for influencer ${code.influencer.name}: $${commissionAmount / 100} (${discountAmount} discount)`);
            }
          }

          // If this is a UGC post discount code, mark the post as rewarded
          if (code.ugcPost && !code.ugcPost.isRewarded) {
            await prisma.ugcPost.update({
              where: { id: code.ugcPost.id },
              data: { 
                isRewarded: true,
                rewardAmount: Math.round(parseFloat(discountCode.amount || '0') * 100), // Store in cents
              },
            });

            console.log(`Marked UGC post ${code.ugcPost.id} as rewarded`);
          }

        } catch (error) {
          console.error(`Error processing discount code ${discountCode.code}:`, error);
          // Continue processing other discount codes
        }
      }
    }

    // Track order metrics for usage analytics
    try {
      await prisma.orderMetric.create({
        data: {
          merchantId: merchant.id,
          orderId: orderId.toString(),
          totalAmount: Math.round(parseFloat(total_price || '0') * 100), // Store in cents
          currency: currency || 'USD',
          discountCodesUsed: discount_codes?.length || 0,
          customerEmail: customer?.email || null,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to create order metric:', error);
    }

    console.log(`Successfully processed order ${orderId} for shop: ${merchant.shop}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Orders create webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 