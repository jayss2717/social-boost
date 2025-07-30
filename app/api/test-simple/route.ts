import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
} 