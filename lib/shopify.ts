import { prisma } from './prisma';
import { calculateCommission } from './stripe';

// Shopify API client class for backward compatibility
export class ShopifyAPI {
  private accessToken: string;
  private shopDomain: string;

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken;
    this.shopDomain = shopDomain;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://${this.shopDomain}/admin/api/2024-01/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Create a real discount code in Shopify
  async createDiscountCode(code: string, discountType: 'percentage' | 'fixed_amount', value: number, usageLimit?: number, expiresAt?: Date) {
    const discountData = {
      price_rule: {
        title: `SocialBoost - ${code}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: discountType === 'percentage' ? 'percentage' : 'fixed_amount',
        value: discountType === 'percentage' ? `-${value}` : `-${value * 100}`, // Convert to cents for fixed amount
        customer_selection: 'all',
        starts_at: new Date().toISOString(),
        ends_at: expiresAt?.toISOString(),
        usage_limit: usageLimit,
        code: code,
        applies_once: false,
      }
    };

    const response = await this.makeRequest('price_rules.json', {
      method: 'POST',
      body: JSON.stringify(discountData),
    });

    return response.price_rule;
  }

  // Delete a discount code from Shopify
  async deleteDiscountCode(priceRuleId: string) {
    await this.makeRequest(`price_rules/${priceRuleId}.json`, {
      method: 'DELETE',
    });
  }

  // Get order details
  async getOrder(orderId: string) {
    const response = await this.makeRequest(`orders/${orderId}.json`);
    return response.order;
  }

  // Get shop information
  async getShopInfo() {
    const response = await this.makeRequest('shop.json');
    return response.shop;
  }

  // Register webhooks
  async registerWebhooks(baseUrl: string) {
    const webhooks = [
      {
        topic: 'orders/create',
        address: `${baseUrl}/api/webhooks/orders-create`,
        format: 'json',
      },
      {
        topic: 'app/uninstalled',
        address: `${baseUrl}/api/webhooks/app-uninstalled`,
        format: 'json',
      },
    ];

    for (const webhook of webhooks) {
      try {
        await this.makeRequest('webhooks.json', {
          method: 'POST',
          body: JSON.stringify({ webhook }),
        });
        console.log(`Registered webhook: ${webhook.topic}`);
      } catch (error) {
        console.error(`Failed to register webhook ${webhook.topic}:`, error);
      }
    }
  }

  // Get usage analytics
  async getUsageAnalytics(startDate: string, endDate: string) {
    const response = await this.makeRequest(`reports/orders.json?since=${startDate}&until=${endDate}`);
    return response.reports;
  }
}

export interface ShopifyOrder {
  id: string;
  order_number: string;
  total_price: string;
  subtotal_price: string;
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  line_items: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    price: string;
  }>;
  customer?: {
    id: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export async function fetchShopifyOrders(merchantId: string, since?: Date): Promise<ShopifyOrder[]> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || !merchant.accessToken) {
      throw new Error('Merchant not found or no access token');
    }

    const shopify = require('shopify-api-node');
    const shopifyClient = new shopify({
      shopName: merchant.shop,
      accessToken: merchant.accessToken,
    });

    const query = since 
      ? `created_at:>='${since.toISOString()}'`
      : 'created_at:>=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const orders = await shopifyClient.order.list({
      limit: 250,
      status: 'any',
      query,
    });

    return orders;
  } catch (error) {
    console.error('Failed to fetch Shopify orders:', error);
    throw error;
  }
}

export async function processOrderForCommission(order: ShopifyOrder, merchantId: string): Promise<unknown> {
  try {
    // Check if order has discount codes
    if (!order.discount_codes || order.discount_codes.length === 0) {
      return null;
    }

    // Find the discount code in our database
    const discountCode = order.discount_codes[0];
    const dbDiscountCode = await prisma.discountCode.findFirst({
      where: {
        code: discountCode.code,
        influencer: {
          merchantId,
        },
      },
      include: {
        influencer: true,
      },
    });

    if (!dbDiscountCode || !dbDiscountCode.influencer) {
      return null;
    }

    // Calculate commission
    const totalAmount = parseFloat(order.total_price) * 100; // Convert to cents
    await calculateCommission(
      totalAmount,
      dbDiscountCode.influencer.commissionRate,
      discountCode.code
    );

    // Check if order metric already exists
    const existingMetric = await prisma.orderMetric.findFirst({
      where: { 
        orderId: order.id,
        merchantId,
      },
    });

    let orderMetric;
    if (existingMetric) {
      // Update existing metric
      orderMetric = await prisma.orderMetric.update({
        where: { id: existingMetric.id },
        data: {
          totalAmount,
          discountCodesUsed: 1,
          customerEmail: order.customer?.email || null,
        },
      });
    } else {
      // Create new metric
      orderMetric = await prisma.orderMetric.create({
        data: {
          orderId: order.id,
          totalAmount,
          discountCodesUsed: 1,
          customerEmail: order.customer?.email || null,
          merchantId,
        },
      });
    }

    // Update discount code usage
    await prisma.discountCode.update({
      where: { id: dbDiscountCode.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return orderMetric;
  } catch (error) {
    console.error('Failed to process order for commission:', error);
    return null;
  }
}

export async function syncOrdersWithCommissions(merchantId: string, since?: Date): Promise<{
  processed: number;
  errors: number;
  totalCommission: number;
}> {
  try {
    const orders = await fetchShopifyOrders(merchantId, since);
    let processed = 0;
    let errors = 0;
    let totalCommission = 0;

    for (const order of orders) {
      try {
        const metric = await processOrderForCommission(order, merchantId);
        if (metric) {
          processed++;
          // Note: Commission calculation would need to be done separately
          // as the OrderMetric model doesn't store commission amounts
        }
      } catch (error) {
        console.error(`Failed to process order ${order.id}:`, error);
        errors++;
      }
    }

    return { processed, errors, totalCommission };
  } catch (error) {
    console.error('Failed to sync orders with commissions:', error);
    throw error;
  }
}

export async function getOrderMetrics(merchantId: string, filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<unknown[]> {
  try {
    const whereClause: Record<string, unknown> = { merchantId };

    if (filters?.startDate || filters?.endDate) {
      whereClause.processedAt = {};
      if (filters.startDate) {
        (whereClause.processedAt as Record<string, unknown>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (whereClause.processedAt as Record<string, unknown>).lte = filters.endDate;
      }
    }

    const metrics = await prisma.orderMetric.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: {
            id: true,
            shop: true,
          },
        },
      },
      orderBy: { processedAt: 'desc' },
    });

    return metrics;
  } catch (error) {
    console.error('Failed to get order metrics:', error);
    throw error;
  }
}

export async function createShopifyDiscountCode(
  merchantId: string,
  code: string,
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT',
  discountValue: number,
  usageLimit: number,
  expiresAt?: Date
): Promise<boolean> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || !merchant.accessToken) {
      throw new Error('Merchant not found or no access token');
    }

    const shopify = require('shopify-api-node');
    const shopifyClient = new shopify({
      shopName: merchant.shop,
      accessToken: merchant.accessToken,
    });

    const discountCode = await shopifyClient.priceRule.create({
      title: `Socialboost - ${code}`,
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: discountType === 'PERCENTAGE' ? 'percentage' : 'fixed_amount',
      value: discountType === 'PERCENTAGE' ? `-${discountValue}` : `-${discountValue * 100}`,
      customer_selection: 'all',
      starts_at: new Date().toISOString(),
      ends_at: expiresAt?.toISOString(),
      usage_limit: usageLimit,
    });

    await shopifyClient.discountCode.create({
      price_rule_id: discountCode.id,
      code: code,
    });

    return true;
  } catch (error) {
    console.error('Failed to create Shopify discount code:', error);
    return false;
  }
}

export async function updateShopifyDiscountCode(
  merchantId: string,
  code: string,
  updates: {
    usageLimit?: number;
    expiresAt?: Date;
    isActive?: boolean;
  }
): Promise<boolean> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || !merchant.accessToken) {
      throw new Error('Merchant not found or no access token');
    }

    const shopify = require('shopify-api-node');
    const shopifyClient = new shopify({
      shopName: merchant.shop,
      accessToken: merchant.accessToken,
    });

    // Find the price rule by discount code
    const discountCodes = await shopifyClient.discountCode.list();
    const discountCode = discountCodes.find((dc: Record<string, unknown>) => dc.code === code);

    if (!discountCode) {
      throw new Error('Discount code not found in Shopify');
    }

    // Update the price rule
    const updateData: Record<string, unknown> = {};
    
    if (updates.usageLimit !== undefined) {
      updateData.usage_limit = updates.usageLimit;
    }
    
    if (updates.expiresAt !== undefined) {
      updateData.ends_at = updates.expiresAt.toISOString();
    }

    await shopifyClient.priceRule.update((discountCode as Record<string, unknown>).price_rule_id as string, updateData);

    return true;
  } catch (error) {
    console.error('Failed to update Shopify discount code:', error);
    return false;
  }
} 