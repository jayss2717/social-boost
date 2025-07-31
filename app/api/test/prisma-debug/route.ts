import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Prisma debug endpoint called');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Test basic Prisma client
    console.log('Testing Prisma client...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Raw query result:', result);
    
    // Try to count merchants
    const merchantCount = await prisma.merchant.count();
    console.log('Merchant count:', merchantCount);
    
    return NextResponse.json({
      success: true,
      message: 'Prisma client working',
      databaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      merchantCount: merchantCount,
      testResult: result
    });
  } catch (error) {
    console.error('Prisma debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    }, { status: 500 });
  }
} 