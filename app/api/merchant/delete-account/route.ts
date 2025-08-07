import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    console.log('🗑️ Account deletion requested for shop:', shop);

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Find the merchant with all related data
    const merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: { 
        subscription: true,
        influencers: true,
        ugcPosts: true,
        discountCodes: true,
        payouts: true,
        socialMediaAccounts: true,
        brandMentions: true,
        orderMetrics: true,
        ugcRejections: true,
        ugcWorkflowRules: true,
        settings: true,
      },
    });

    if (!merchant) {
      console.log(`No merchant found for shop: ${shop}`);
      return NextResponse.json({ 
        success: true, 
        message: 'No merchant found to delete',
        shop 
      });
    }

    console.log(`🗑️ Starting account deletion for shop: ${shop} - Merchant ID: ${merchant.id}`);
    console.log(`🗑️ Data to be deleted: ${merchant.influencers.length} influencers, ${merchant.ugcPosts.length} UGC posts, ${merchant.discountCodes.length} discount codes, ${merchant.payouts.length} payouts`);

    // Cancel any active subscriptions first
    if (merchant.subscription) {
      await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: { status: 'CANCELED' },
      });
      console.log(`✅ Cancelled subscription for shop: ${shop}`);
    }

    // Delete the merchant (this will cascade delete all related data)
    await prisma.merchant.delete({
      where: { shop },
    });

    console.log(`✅ Successfully deleted merchant and all related data for shop: ${shop}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully',
      dataDeleted: {
        merchant: true,
        subscription: merchant.subscription ? true : false,
        influencers: merchant.influencers.length,
        ugcPosts: merchant.ugcPosts.length,
        discountCodes: merchant.discountCodes.length,
        payouts: merchant.payouts.length,
        socialMediaAccounts: merchant.socialMediaAccounts.length,
        brandMentions: merchant.brandMentions.length,
        orderMetrics: merchant.orderMetrics.length,
        ugcRejections: merchant.ugcRejections.length,
        ugcWorkflowRules: merchant.ugcWorkflowRules.length,
        settings: merchant.settings ? true : false,
      }
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Account deletion failed' }, { status: 500 });
  }
} 