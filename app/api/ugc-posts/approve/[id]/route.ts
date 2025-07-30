import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // In production, this would update the UGC post in the database
    console.log('Approving UGC post:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to approve UGC post:', error);
    return NextResponse.json(
      { error: 'Failed to approve UGC post' },
      { status: 500 }
    );
  }
} 