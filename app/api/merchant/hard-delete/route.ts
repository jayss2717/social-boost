import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    console.log(`Hard delete requested for shop: ${shop}`);

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
        settings: true,
        orderMetrics: true,
        ugcRejections: true,
        ugcWorkflowRules: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ 
        success: true, 
        message: 'No merchant found to delete' 
      });
    }

    // Log what we're about to delete for audit purposes
    const dataSummary = {
      merchantId: merchant.id,
      shop: merchant.shop,
      influencers: merchant.influencers.length,
      ugcPosts: merchant.ugcPosts.length,
      discountCodes: merchant.discountCodes.length,
      payouts: merchant.payouts.length,
      socialMediaAccounts: merchant.socialMediaAccounts.length,
      brandMentions: merchant.brandMentions.length,
    };

    console.log('Hard delete data summary:', dataSummary);

    // Perform hard delete - this will cascade delete all related data
    await prisma.merchant.delete({
      where: { shop },
    });

    console.log(`Hard delete completed for shop: ${shop}`);

    return NextResponse.json({ 
      success: true, 
      message: 'All data permanently deleted',
      deletedData: dataSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Hard delete error:', error);
    return NextResponse.json({ error: 'Hard delete failed' }, { status: 500 });
  }
} 