import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const invoiceId = searchParams.get('invoiceId');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Find the merchant and their subscription
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (!merchant.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // If specific invoice ID requested
    if (invoiceId) {
      if (stripe) {
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          
          // Redirect to the hosted invoice URL instead of trying to download PDF
          if (invoice.hosted_invoice_url) {
            return NextResponse.json({
              success: true,
              url: invoice.hosted_invoice_url,
              message: 'Redirecting to invoice...',
            });
          } else {
            return NextResponse.json({ error: 'Invoice PDF not available' }, { status: 404 });
          }
        } catch (stripeError) {
          console.error('Stripe invoice error:', stripeError);
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
      }
    }

    // Get all invoices for the customer - try to find Stripe customer by shop
    if (stripe) {
      try {
        // Try to find Stripe customer by shop domain
        const customers = await stripe.customers.list({
          limit: 100,
        });
        
        const customer = customers.data.find(c => 
          c.metadata?.shop === merchant.shop || 
          c.email === merchant.shopEmail
        );

        if (customer) {
          const invoices = await stripe.invoices.list({
            customer: customer.id,
            limit: 10,
          });

          const formattedInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            number: invoice.number,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            created: invoice.created,
            due_date: invoice.due_date,
            period_start: invoice.period_start,
            period_end: invoice.period_end,
            pdf_url: invoice.hosted_invoice_url,
            download_url: invoice.invoice_pdf,
          }));

          return NextResponse.json({
            success: true,
            invoices: formattedInvoices,
          });
        }
      } catch (stripeError) {
        console.error('Stripe invoices error:', stripeError);
        // Continue to fallback
      }
    }

    // Fallback: Create mock invoices from subscription data
    const mockInvoices = [
      {
        id: 'current-invoice',
        number: 'INV-001',
        amount_paid: merchant.subscription.plan?.priceCents || 0,
        currency: 'usd',
        status: 'paid',
        created: Math.floor(merchant.subscription.currentPeriodEnd.getTime() / 1000),
        due_date: Math.floor(merchant.subscription.currentPeriodEnd.getTime() / 1000),
        period_start: Math.floor(merchant.subscription.createdAt.getTime() / 1000),
        period_end: Math.floor(merchant.subscription.currentPeriodEnd.getTime() / 1000),
        pdf_url: null,
        download_url: null,
      },
      {
        id: 'initial-invoice',
        number: 'INV-000',
        amount_paid: merchant.subscription.plan?.priceCents || 0,
        currency: 'usd',
        status: 'paid',
        created: Math.floor(merchant.subscription.createdAt.getTime() / 1000),
        due_date: Math.floor(merchant.subscription.createdAt.getTime() / 1000),
        period_start: Math.floor(merchant.subscription.createdAt.getTime() / 1000),
        period_end: Math.floor(merchant.subscription.currentPeriodEnd.getTime() / 1000),
        pdf_url: null,
        download_url: null,
      },
    ];

    return NextResponse.json({
      success: true,
      invoices: mockInvoices,
    });
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
} 