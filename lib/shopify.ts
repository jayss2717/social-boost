// import { shopifyApp } from '@shopify/shopify-app-express'; // Not used in current implementation

// Enhanced Shopify API client
class ShopifyAPI {
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

// Basic Shopify app configuration
const shopify = {
  auth: {
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    scopes: [
      'read_orders', 
      'write_discounts', 
      'read_products', 
      'read_customers',
      'write_products',
      'read_inventory',
      'write_inventory',
      'read_analytics',
      'read_marketing_events',
      'write_marketing_events',
      'write_script_tags',
      'read_script_tags'
    ],
    hostName: process.env.HOST?.replace(/https:\/\//, '') || 'localhost:3000',
    isEmbeddedApp: true,
  },
};

export { ShopifyAPI };
export default shopify; 