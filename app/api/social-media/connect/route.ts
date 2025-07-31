import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
    }

    const { platform, accountId, username, displayName, accessToken, refreshToken } = await request.json();

    if (!platform || !accountId || !username || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if account already exists
    const existingAccount = await prisma.socialMediaAccount.findUnique({
      where: {
        merchantId_platform: {
          merchantId,
          platform: platform as any,
        },
      },
    });

    if (existingAccount) {
      // Update existing account
      const updatedAccount = await prisma.socialMediaAccount.update({
        where: { id: existingAccount.id },
        data: {
          accountId,
          username,
          displayName,
          accessToken,
          refreshToken,
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        account: updatedAccount,
        message: 'Social media account updated successfully',
      });
    } else {
      // Create new account
      const newAccount = await prisma.socialMediaAccount.create({
        data: {
          merchantId,
          platform: platform as any,
          accountId,
          username,
          displayName,
          accessToken,
          refreshToken,
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        account: newAccount,
        message: 'Social media account connected successfully',
      });
    }
  } catch (error) {
    console.error('Failed to connect social media account:', error);
    return NextResponse.json({ error: 'Failed to connect social media account' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 401 });
    }

    const accounts = await prisma.socialMediaAccount.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Failed to fetch social media accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch social media accounts' }, { status: 500 });
  }
} 