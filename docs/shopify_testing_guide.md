# Shopify Testing Guide

This guide will help you test the SocialBoost Shopify app integration.

## Prerequisites

1. **Shopify Partner Account**
   - Sign up at [partners.shopify.com](https://partners.shopify.com)
   - Create a new app in your partner dashboard

2. **Development Environment**
   - Node.js 20+
   - Docker & Docker Compose
   - ngrok (for webhook testing)

## Setup Steps

### 1. Create a Shopify App

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click "Apps" → "Create app"
3. Choose "Custom app" for development
4. Set the following URLs:
   - **App URL**: `http://localhost:3000`
   - **Allowed redirection URL(s)**: `http://localhost:3000/api/auth/shopify/callback`

### 2. Configure Environment Variables

Update your `.env.local` file with your Shopify app credentials:

```bash
# Shopify App
SHOPIFY_API_KEY="your_actual_api_key"
SHOPIFY_API_SECRET="your_actual_api_secret"
HOST="http://localhost:3000"

# For production, use your actual domain
# HOST="https://your-app-domain.com"
```

### 3. Start Development Services

```bash
# Start database and Redis
docker compose up -d db redis

# Start development server
npm run dev
```

### 4. Set up ngrok for Webhook Testing

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Start ngrok
ngrok http 3000
```

Update your Shopify app webhook URLs with the ngrok URL:
- `https://your-ngrok-url.ngrok.io/api/webhooks/app-uninstalled`
- `https://your-ngrok-url.ngrok.io/api/webhooks/orders-create`

## Testing the Integration

### 1. Run the Test Suite

```bash
# Test all endpoints
npm run test:app

# Test Shopify-specific functionality
npm run test:shopify
```

### 2. Manual Testing Flow

#### A. App Installation
1. Visit: `http://localhost:3000/install`
2. Enter a test shop domain (e.g., `test-store.myshopify.com`)
3. Click "Install App"
4. This should redirect to Shopify OAuth

#### B. OAuth Flow
1. The OAuth URL will redirect to Shopify
2. After authorization, you'll be redirected back to your app
3. The app will create a merchant record and redirect to onboarding

#### C. Onboarding Flow
1. Visit: `http://localhost:3000/test-onboarding`
2. Click "Simulate OAuth & Start Onboarding"
3. This creates a test merchant and starts onboarding

#### D. Dashboard Access
1. After onboarding, you'll be redirected to the dashboard
2. Test all features: influencers, UGC posts, payouts, etc.

### 3. Webhook Testing

#### A. App Uninstalled Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/app-uninstalled \
  -H "Content-Type: application/json" \
  -d '{
    "shop_domain": "test-store.myshopify.com",
    "id": 123456789
  }'
```

#### B. Orders Create Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/orders-create \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123456789,
    "shop_domain": "test-store.myshopify.com",
    "line_items": [{
      "id": 1,
      "product_id": 123,
      "quantity": 1
    }]
  }'
```

#### C. Instagram Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "test-entry",
      "time": 1234567890
    }]
  }'
```

#### D. TikTok Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/tiktok \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test_event",
    "shop": "test-store.myshopify.com"
  }'
```

## Testing with Real Shopify Store

### 1. Development Store
1. Create a development store in your partner dashboard
2. Install your app on the development store
3. Test all features with real Shopify data

### 2. Production Testing
1. Create a production app in your partner dashboard
2. Set up proper webhook URLs
3. Test with a real Shopify store

## Common Issues and Solutions

### 1. OAuth Redirect Issues
- **Problem**: OAuth URL returns 403 Forbidden
- **Solution**: Ensure your app URL and redirect URLs are correctly configured in Shopify Partner Dashboard

### 2. Webhook Not Receiving
- **Problem**: Webhooks not being received
- **Solution**: 
  - Use ngrok for local development
  - Verify webhook URLs in Shopify Partner Dashboard
  - Check webhook secret verification

### 3. Database Connection Issues
- **Problem**: Database connection errors
- **Solution**: 
  - Ensure PostgreSQL is running: `docker compose up -d db`
  - Run migrations: `npm run db:migrate`
  - Seed database: `npm run db:seed`

### 4. Redis Connection Issues
- **Problem**: Redis connection errors
- **Solution**: 
  - Ensure Redis is running: `docker compose up -d redis`
  - Check Redis URL in environment variables

## Test Data

The app includes test data for development:

- **Test Merchant**: `test-store.myshopify.com`
- **Test Influencers**: 3 sample influencers
- **Test UGC Posts**: 3 sample posts
- **Test Discount Codes**: Sample discount codes

## Monitoring and Debugging

### 1. Check Logs
```bash
# Development server logs
npm run dev

# Database logs
docker compose logs db

# Redis logs
docker compose logs redis
```

### 2. Database Inspection
```bash
# Open Prisma Studio
npm run db:studio
```

### 3. API Testing
```bash
# Test all endpoints
npm run test:app

# Test Shopify integration
npm run test:shopify
```

## Production Checklist

Before deploying to production:

- [ ] Update environment variables with production values
- [ ] Set up proper webhook URLs
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Test with real Shopify stores
- [ ] Verify all webhooks are working
- [ ] Test OAuth flow end-to-end
- [ ] Verify database migrations
- [ ] Test all app features

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure all services are running
4. Test with the provided test scripts
5. Check Shopify Partner Dashboard configuration

## Next Steps

1. **Complete the setup** with your actual Shopify app credentials
2. **Test with a development store** to verify all functionality
3. **Deploy to production** when ready
4. **Monitor the app** for any issues
5. **Gather feedback** from real users 