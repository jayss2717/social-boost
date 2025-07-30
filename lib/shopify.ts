import { shopifyApp } from '@shopify/shopify-app-express';
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { prisma } from './prisma';

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
      'write_marketing_events'
    ],
    hostName: process.env.HOST!.replace(/https:\/\//, ''),
    isEmbeddedApp: true,
  },
  sessionStorage: new PrismaSessionStorage(prisma),
};

export default shopify; 