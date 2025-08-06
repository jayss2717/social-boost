# SocialBoost

A production-ready Shopify app for managing influencer marketing and UGC campaigns.

## Features

- **Influencer Management**: Add, track, and manage influencer relationships
- **UGC Post Tracking**: Monitor and approve user-generated content
- **Discount Code Generation**: Create unique discount codes for influencers
- **Payout Processing**: Automated commission calculations and Stripe Connect payouts
- **Analytics Dashboard**: Comprehensive insights and performance metrics
- **Stripe Connect Integration**: Secure payment processing for influencers
- **Shopify Webhooks**: Real-time order and app lifecycle management

## Production Setup

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL="postgresql://..."

# Shopify
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_APP_URL="https://your-app.vercel.app"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis (for queue management)
REDIS_URL="redis://..."
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed plans (optional)
npm run db:seed
```

### Deployment

This app is deployed on Vercel and automatically builds from the main branch.

## Architecture

- **Frontend**: Next.js 14 with Shopify Polaris UI
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Supabase
- **Payments**: Stripe Connect for influencer payouts
- **Queue**: BullMQ with Redis for background jobs
- **Deployment**: Vercel with automatic CI/CD

## Security

- Shopify OAuth 2.0 authentication
- Stripe Connect for secure payments
- GDPR-compliant data handling
- Webhook signature verification
- Rate limiting and error handling 