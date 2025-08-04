# Stripe Webhook Setup Guide

## Problem
The subscription is not automatically updating after payment because the Stripe webhook is not properly configured.

## Solution Steps

### 1. Configure Stripe Webhook in Dashboard

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Add Endpoint**: 
   - URL: `https://socialboost-blue.vercel.app/api/subscription/webhook`
   - Events to send: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### 2. Get Webhook Secret

1. **Copy the webhook secret** from the Stripe dashboard
2. **Add to Vercel environment variables**:
   - Go to Vercel dashboard
   - Navigate to your project
   - Go to Settings > Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET` = [your webhook secret]

### 3. Test Webhook Configuration

Use the debug endpoint to test:
```bash
curl "https://socialboost-blue.vercel.app/api/debug/check-webhook-config?shop=teststorev103.myshopify.com"
```

### 4. Verify Customer Creation

The webhook needs a Stripe customer with proper metadata:
- `shop`: The Shopify shop domain
- `merchantId`: The database merchant ID

### 5. Test Payment Flow

1. **Make a test payment**
2. **Check webhook logs** in Stripe dashboard
3. **Verify subscription update** in database

## Debug Endpoints

- `/api/debug/check-webhook-config` - Check webhook configuration
- `/api/debug/create-stripe-customer` - Manually create customer
- `/api/debug/force-pro-upgrade` - Manually update subscription

## Expected Flow

1. **User clicks upgrade** → Stripe checkout
2. **Payment successful** → Stripe sends webhook
3. **Webhook processes** → Updates subscription in database
4. **User redirected** → Sees updated Pro plan limits

## Troubleshooting

### Issue: Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret is set
- Check Stripe dashboard for failed deliveries

### Issue: Customer not found
- Ensure customer is created with proper metadata
- Check customer creation in upgrade flow

### Issue: Plan not updating
- Verify plan name mapping in webhook
- Check database plan exists
- Review webhook logs for errors 