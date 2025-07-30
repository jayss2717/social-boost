import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SocialBoost Test API is working!',
    timestamp: new Date().toISOString(),
    features: [
      'Dashboard Metrics',
      'Subscription Management', 
      'Influencer Management',
      'UGC Post Tracking',
      'Commission Calculations',
      'Payout Processing',
      'Plan Limits & Upgrades'
    ]
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    message: 'Test POST endpoint working!',
    receivedData: body,
    timestamp: new Date().toISOString()
  });
} 