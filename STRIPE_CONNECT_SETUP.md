# Stripe Connect Setup Guide

## 🎯 Overview
This guide will help you set up Stripe Connect for influencer payouts in the socialboost app.

## 🔧 Prerequisites

### 1. Stripe Account Setup
- **Stripe Account**: You need a Stripe account (https://stripe.com)
- **Stripe Dashboard**: Access to Stripe Dashboard
- **API Keys**: Both test and live API keys

### 2. Environment Variables Required

#### For Development (.env file):
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### For Production (Vercel Environment Variables):
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
```

## 🚀 Setup Steps

### Step 1: Get Stripe API Keys

1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Developers → API Keys**
3. **Copy the keys**:
   - **Secret Key**: Starts with `sk_test_` (test) or `sk_live_` (live)
   - **Publishable Key**: Starts with `pk_test_` (test) or `pk_live_` (live)

### Step 2: Configure Environment Variables

#### For Local Development:
```bash
# Add to your .env file
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### For Production (Vercel):
1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add the following variables**:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., https://socialboost-blue.vercel.app)

### Step 3: Enable Stripe Connect

1. **In Stripe Dashboard**: Go to **Connect → Settings**
2. **Enable Connect**: Make sure Connect is enabled for your account
3. **Configure Webhooks**: Set up webhooks for Connect events

### Step 4: Test the Setup

#### Test Environment Variables:
```bash
curl -X GET "http://localhost:3000/api/test/stripe-connect"
```

#### Test Stripe Connect Account Creation:
```bash
curl -X POST "http://localhost:3000/api/test/stripe-debug" \
  -H "Content-Type: application/json" \
  -d '{"influencerId": "your_influencer_id"}'
```

## 🔍 Troubleshooting

### Common Issues:

#### 1. "Invalid API Key provided"
- **Cause**: Stripe API key is not set or invalid
- **Solution**: 
  - Check if `STRIPE_SECRET_KEY` is set in environment
  - Verify the key is correct in Stripe Dashboard
  - For production, check Vercel environment variables

#### 2. "Influencer not found"
- **Cause**: The influencer ID doesn't exist in the database
- **Solution**: 
  - Verify the influencer exists
  - Check the influencer ID is correct
  - Ensure the influencer belongs to the merchant

#### 3. "Failed to create Stripe Connect account"
- **Cause**: Stripe account creation failed
- **Solution**:
  - Check Stripe account permissions
  - Verify Connect is enabled
  - Check Stripe API limits

### Debug Commands:

#### Check Environment Variables:
```bash
curl -X GET "http://localhost:3000/api/test/stripe-connect" | jq .
```

#### Test Account Creation:
```bash
curl -X POST "http://localhost:3000/api/test/stripe-debug" \
  -H "Content-Type: application/json" \
  -d '{"influencerId": "cmdzhklea000bl404ecqpwf6i"}' | jq .
```

## 📋 Required Stripe Permissions

### Connect Account Capabilities:
- **Transfers**: Required for payouts
- **Express**: For simplified onboarding

### Webhook Events:
- `account.updated`
- `account.application.authorized`
- `account.application.deauthorized`
- `transfer.created`
- `transfer.paid`
- `transfer.failed`
- `transfer.updated`

## 🎯 How It Works

### 1. Influencer Onboarding Flow:
1. **Merchant clicks "Stripe Connect"** on influencer row
2. **System creates Stripe Connect account** for the influencer
3. **Generates onboarding link** for the influencer
4. **Influencer completes onboarding** via Stripe
5. **System updates influencer status** when complete

### 2. Payout Flow:
1. **Order is placed** with influencer's discount code
2. **System calculates commission** based on merchant settings
3. **Creates payout record** in database
4. **Transfers funds** to influencer's Stripe account
5. **Updates payout status** via webhooks

## 🔒 Security Considerations

### Environment Variables:
- **Never commit API keys** to version control
- **Use different keys** for test and production
- **Rotate keys regularly** for security

### Webhook Security:
- **Verify webhook signatures** from Stripe
- **Use HTTPS** for all webhook endpoints
- **Validate event data** before processing

## 📞 Support

If you encounter issues:
1. **Check the debug endpoints** above
2. **Review Stripe Dashboard** for account status
3. **Check server logs** for detailed error messages
4. **Verify environment variables** are set correctly

## 🚀 Next Steps

Once Stripe Connect is set up:
1. **Test the complete flow** from merchant to influencer
2. **Set up webhooks** for real-time updates
3. **Configure payout schedules** based on merchant preferences
4. **Monitor payout analytics** and performance 