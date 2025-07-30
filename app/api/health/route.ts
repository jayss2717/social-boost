import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/monitoring';

export async function GET() {
  try {
    const checks = await healthCheck();
    
    const isHealthy = checks.database && checks.redis;
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    }, {
      status: isHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
} 