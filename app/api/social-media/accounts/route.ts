import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get merchant
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
      include: { socialMediaAccounts: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant found' }, { status: 404 });
    }

    // Return social media accounts with sensitive data removed
    const accounts = merchant.socialMediaAccounts.map(account => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      isActive: account.isActive,
      lastSyncAt: account.lastSyncAt,
      createdAt: account.createdAt,
    }));

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Failed to get social media accounts:', error);
    return NextResponse.json({ error: 'Failed to get social media accounts' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findFirst({
      where: { isActive: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant found' }, { status: 404 });
    }

    // Delete social media account
    await prisma.socialMediaAccount.delete({
      where: {
        id: accountId,
        merchantId: merchant.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Social media account disconnected successfully',
    });
  } catch (error) {
    console.error('Failed to disconnect social media account:', error);
    return NextResponse.json({ error: 'Failed to disconnect social media account' }, { status: 500 });
  }
} 