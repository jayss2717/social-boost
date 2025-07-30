import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test a simple query
    const merchantCount = await prisma.merchant.count();
    console.log('Merchant count:', merchantCount);
    
    // Test creating a simple record (will be rolled back)
    const testResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Test query result:', testResult);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      merchantCount,
      testResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 