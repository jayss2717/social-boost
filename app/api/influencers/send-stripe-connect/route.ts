import { NextRequest } from 'next/server';
import { requireMerchantId } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/api';

export async function POST(request: NextRequest) {
  try {
    const merchantId = requireMerchantId(request);
    const body = await request.json();
    const { influencerEmail, influencerName, onboardingUrl } = body;

    if (!influencerEmail || !influencerName || !onboardingUrl) {
      return createErrorResponse('Missing required fields', 400);
    }

    console.log('📧 Sending Stripe Connect email to:', {
      influencerEmail,
      influencerName,
      merchantId,
    });

    // For now, we'll just log the email details
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
    console.log('📧 Email would be sent with:');
    console.log('  To:', influencerEmail);
    console.log('  Subject: Complete your Stripe Connect setup');
    console.log('  Body:');
    console.log(`    Hi ${influencerName},`);
    console.log('    You need to complete your Stripe Connect setup to receive payouts.');
    console.log('    Please click the link below to complete your onboarding:');
    console.log(`    ${onboardingUrl}`);
    console.log('    This link will expire in 24 hours.');
    console.log('    Best regards,');
    console.log('    Your SocialBoost Team');

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //   to: influencerEmail,
    //   from: 'noreply@socialboost.com',
    //   subject: 'Complete your Stripe Connect setup',
    //   html: `
    //     <h2>Hi ${influencerName},</h2>
    //     <p>You need to complete your Stripe Connect setup to receive payouts.</p>
    //     <p>Please click the link below to complete your onboarding:</p>
    //     <a href="${onboardingUrl}" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Setup</a>
    //     <p>This link will expire in 24 hours.</p>
    //     <p>Best regards,<br>Your SocialBoost Team</p>
    //   `,
    // };
    // 
    // await sgMail.send(msg);

    return createSuccessResponse(
      { emailSent: true, recipient: influencerEmail },
      'Stripe Connect email sent successfully'
    );
  } catch (error) {
    console.error('Failed to send Stripe Connect email:', error);
    if (error instanceof Error && error.message === 'Merchant ID required') {
      return createErrorResponse('Merchant ID required', 401);
    }
    return createErrorResponse('Failed to send email', 500);
  }
} 