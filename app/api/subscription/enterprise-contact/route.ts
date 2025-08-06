import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      shop, 
      name, 
      email, 
      company, 
      phone, 
      requirements, 
      budget,
      expectedUsers,
      timeline 
    } = body;

    if (!shop || !name || !email) {
      return NextResponse.json({ 
        error: 'Missing required fields: shop, name, email' 
      }, { status: 400 });
    }

    console.log('🏢 Enterprise contact request:', {
      shop,
      name,
      email,
      company,
      requirements,
      budget,
      expectedUsers,
      timeline
    });

    // Find or create merchant
    let merchant = await prisma.merchant.findUnique({
      where: { shop },
      include: { subscription: true }
    });

    if (!merchant) {
      return NextResponse.json({ 
        error: 'Merchant not found' 
      }, { status: 404 });
    }

    // Get Enterprise plan
    const enterprisePlan = await prisma.plan.findUnique({
      where: { name: 'ENTERPRISE' }
    });

    if (!enterprisePlan) {
      return NextResponse.json({ 
        error: 'Enterprise plan not found' 
      }, { status: 404 });
    }

    // Create or update subscription with PENDING status
    let subscription;
    if (merchant.subscription) {
      subscription = await prisma.subscription.update({
        where: { id: merchant.subscription.id },
        data: {
          planId: enterprisePlan.id,
          status: 'PENDING', // Special status for Enterprise
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: { plan: true }
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          merchantId: merchant.id,
          planId: enterprisePlan.id,
          status: 'PENDING', // Special status for Enterprise
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: { plan: true }
      });
    }

    // Store Enterprise contact details (you can extend this table as needed)
    const enterpriseContact = await prisma.merchantSettings.upsert({
      where: { merchantId: merchant.id },
      update: {
        enterpriseContact: {
          name,
          email,
          company,
          phone,
          requirements,
          budget,
          expectedUsers,
          timeline,
          submittedAt: new Date().toISOString()
        }
      },
      create: {
        merchantId: merchant.id,
        enterpriseContact: {
          name,
          email,
          company,
          phone,
          requirements,
          budget,
          expectedUsers,
          timeline,
          submittedAt: new Date().toISOString()
        }
      }
    });

    console.log('✅ Enterprise contact stored:', {
      merchantId: merchant.id,
      subscriptionId: subscription.id,
      plan: subscription.plan.name,
      status: subscription.status
    });

    return NextResponse.json({
      success: true,
      message: 'Enterprise contact request submitted successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan.name,
        currentPeriodEnd: subscription.currentPeriodEnd
      },
      contact: {
        name,
        email,
        company,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Enterprise contact error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit enterprise contact request' 
    }, { status: 500 });
  }
} 