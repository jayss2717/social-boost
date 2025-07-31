import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('tiktok-developers-site-verification=VW23tHwzUjPEgZSHF4zsdICImoSeFBhm', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 