# Stripe Connect Integration for Influencer Payouts

## Overview

This guide covers the complete Stripe Connect integration for processing influencer payouts in the SocialBoost app.

## 🏗️ Architecture

### Components
1. **Stripe Connect Account Creation** - Creates connected accounts for influencers
2. **Onboarding Flow** - Guides influencers through Stripe account setup
3. **Payout Processing** - Transfers funds to influencer accounts
4. **Webhook Handling** - Updates payout status in real-time
5. **Status Tracking** - Monitors account and transfer status

## 🔧 Implementation

### 1. Database Schema

The following fields are added to the `Influencer` model:
```prisma
model Influencer {
  // ... existing fields
  stripeAccountId    String?  // Stripe Connect account ID
  stripeAccountStatus String?  // Account status from Stripe
}
```

### 2. API Endpoints

#### Create Stripe Connect Account
```typescript
POST /api/influencers/[id]/stripe-connect
```
- Creates a Stripe Connect account for the influencer
- Returns onboarding URL for account setup

#### Get Account Status
```typescript
GET /api/influencers/[id]/stripe-connect
```
- Returns current account status and details
- Includes verification requirements

#### Complete Onboarding
```typescript
GET /api/influencers/[id]/stripe-connect/complete
```
- Handles return from Stripe onboarding
- Updates account status

#### Refresh Onboarding
```typescript
GET /api/influencers/[id]/stripe-connect/refresh
```
- Generates new onboarding link if expired

### 3. Payout Processing

#### Process Individual Payout
```typescript
POST /api/payouts/[id]/process
```
- Creates transfer to influencer's Stripe account
- Updates payout status

#### Bulk Process Payouts
```typescript
POST /api/payouts/bulk-process
```
- Processes multiple payouts at once
- Handles errors gracefully

### 4. Webhook Handling

The Stripe webhook (`/api/webhooks/stripe`) handles:
- `account.updated` - Account status changes
- `transfer.created` - Payout processing started
- `transfer.paid` - Payout completed
- `transfer.failed` - Payout failed

## 🚀 Setup Instructions

### 1. Environment Variables

Add to your `.env` file:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. Stripe Dashboard Setup

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Complete business verification

2. **Enable Connect**
   - Go to Developers > Connect
   - Enable Connect for your account

3. **Configure Webhooks**
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
   - Select events:
     - `account.updated`
     - `transfer.created`
     - `transfer.paid`
     - `transfer.failed`

4. **Set Account Types**
   - Go to Settings > Connect settings
   - Choose "Express" for simple onboarding
   - Configure business types and requirements

### 3. Database Migration

Run the migration to add Stripe fields:
```bash
npx prisma migrate dev --name add_stripe_connect
```

### 4. Test the Integration

1. **Create Test Influencer**
   ```bash
   curl -X POST /api/influencers \
     -H "x-merchant-id: your-merchant-id" \
     -d '{"name":"Test Influencer","email":"test@example.com"}'
   ```

2. **Create Stripe Connect Account**
   ```bash
   curl -X POST /api/influencers/[id]/stripe-connect \
     -H "x-merchant-id: your-merchant-id"
   ```

3. **Process Test Payout**
   ```bash
   curl -X POST /api/payouts/[id]/process \
     -H "x-merchant-id: your-merchant-id"
   ```

## 🎯 Usage Flow

### For Merchants

1. **Add Influencer**
   - Navigate to Influencers page
   - Click "Add Influencer"
   - Fill in influencer details

2. **Connect Stripe Account**
   - Click "Stripe Connect" button
   - Influencer completes onboarding
   - Account status updates automatically

3. **Process Payouts**
   - Navigate to Payouts page
   - Click "Process Payout" for connected influencers
   - Monitor status via webhooks

### For Influencers

1. **Receive Invitation**
   - Merchant adds influencer to platform
   - Receives email with onboarding link

2. **Complete Onboarding**
   - Click onboarding link
   - Complete Stripe account setup
   - Verify business information

3. **Receive Payouts**
   - Payouts processed automatically
   - Funds transferred to connected account
   - Status updates in real-time

## 🔍 Monitoring & Debugging

### Check Account Status
```bash
curl -X GET /api/influencers/[id]/stripe-connect \
  -H "x-merchant-id: your-merchant-id"
```

### View Webhook Events
- Check Stripe Dashboard > Developers > Webhooks
- View event logs and delivery status

### Database Queries
```sql
-- Check connected influencers
SELECT name, email, stripeAccountId, stripeAccountStatus 
FROM influencers 
WHERE stripeAccountId IS NOT NULL;

-- Check payout status
SELECT p.*, i.name as influencer_name 
FROM payouts p 
JOIN influencers i ON p.influencerId = i.id 
WHERE p.stripeTransferId IS NOT NULL;
```

## 🛡️ Security Considerations

1. **Webhook Verification**
   - All webhooks verified with signature
   - Uses `STRIPE_WEBHOOK_SECRET`

2. **Account Isolation**
   - Each influencer has separate Connect account
   - No shared financial data

3. **Error Handling**
   - Graceful failure for network issues
   - Retry logic for failed transfers
   - Status tracking for all operations

## 📊 Analytics & Reporting

### Payout Metrics
- Total payouts processed
- Success/failure rates
- Average payout amounts
- Processing times

### Account Status
- Connected vs unconnected influencers
- Verification completion rates
- Onboarding abandonment

## 🔧 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check Stripe dashboard for errors

2. **Account Creation Fails**
   - Verify Stripe API keys
   - Check account type configuration
   - Review error logs

3. **Transfer Fails**
   - Check account verification status
   - Verify account has valid bank account
   - Review transfer requirements

### Debug Commands

```bash
# Test webhook endpoint
curl -X POST https://your-app.vercel.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'

# Check account status
curl -X GET /api/influencers/[id]/stripe-connect \
  -H "x-merchant-id: your-merchant-id"
```

## 🚀 Production Checklist

- [ ] Stripe account verified and activated
- [ ] Connect enabled and configured
- [ ] Webhooks configured and tested
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Error handling implemented
- [ ] Monitoring setup
- [ ] Security review completed

## 📚 Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Webhook Guide](https://stripe.com/docs/webhooks)
- [API Reference](https://stripe.com/docs/api)
- [Testing Guide](https://stripe.com/docs/testing)

---

**The Stripe Connect integration is now fully implemented and ready for production use!** 🎉 