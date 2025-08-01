import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
    NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? 'Set' : 'Not set',
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? 'Set' : 'Not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set',
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID ? 'Set' : 'Not set',
    TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY ? 'Set' : 'Not set',
    VERCEL_URL: process.env.VERCEL_URL,
  };

  return NextResponse.json({
    success: true,
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
} 