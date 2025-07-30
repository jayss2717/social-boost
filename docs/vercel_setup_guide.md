# Vercel Setup Guide for SocialBoost

This guide will walk you through setting up Vercel deployment for your SocialBoost Shopify app from scratch.

## Prerequisites

- Node.js 20+ installed
- Git repository with your SocialBoost project
- Vercel account (free tier available)
- Environment variables ready

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

Choose GitHub authentication for seamless integration.

## Step 3: Initialize Vercel Project

### Option A: Using Vercel CLI (Recommended)

```bash
# Navigate to your project directory
cd /path/to/socialboost

# Initialize Vercel project
vercel

# Follow the prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - What's your project's name? → socialboost
# - In which directory is your code located? → ./
# - Want to override the settings? → No
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings

## Step 4: Configure Environment Variables

### Required Environment Variables

Set these in your Vercel project dashboard:

```bash
# Database
DATABASE_URL=your_supabase_postgresql_url

# Shopify App
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_APP_URL=https://your-app.vercel.app

# Redis (for queues)
REDIS_URL=your_redis_url

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Social Media APIs
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
TIKTOK_ACCESS_TOKEN=your_tiktok_token

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.vercel.app

# Monitoring
SENTRY_DSN=your_sentry_dsn (optional)
```

### How to Set Environment Variables

#### Via Vercel CLI:
```bash
vercel env add DATABASE_URL
vercel env add SHOPIFY_API_KEY
# ... repeat for all variables
```

#### Via Vercel Dashboard:
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate environment (Production, Preview, Development)

## Step 5: Configure Vercel Settings

Your project already has a `vercel.json` configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Step 6: Deploy Your Application

### First Deployment

```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### Automatic Deployments

Once connected to GitHub, Vercel will automatically deploy:
- **Production**: When you push to `main` branch
- **Preview**: When you push to any other branch

## Step 7: Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS records as instructed

## Step 8: Set Up Database

### For Supabase (Recommended)

1. Create a Supabase project
2. Get your PostgreSQL connection string
3. Add to Vercel environment variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

### Database Migrations

```bash
# Run migrations on Vercel
vercel env pull .env.local
npx prisma db push
```

## Step 9: Configure Shopify App

1. Update your Shopify app settings with Vercel URLs:
   - **App URL**: `https://your-app.vercel.app`
   - **Allowed redirection URLs**: 
     - `https://your-app.vercel.app/api/auth/shopify/callback`
     - `https://your-app.vercel.app/api/auth/shopify`

2. Update webhook endpoints in Shopify dashboard

## Step 10: Test Your Deployment

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### Test API Endpoints
```bash
curl https://your-app.vercel.app/api/test
```

## Step 11: Monitor Your Application

### Vercel Analytics
- Enable in your project dashboard
- Monitor performance and usage

### Function Logs
```bash
vercel logs
```

### Real-time Monitoring
- Use Vercel dashboard for real-time monitoring
- Set up alerts for errors

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   vercel logs
   
   # Test build locally
   npm run build
   ```

2. **Environment Variables**
   ```bash
   # Pull environment variables
   vercel env pull .env.local
   
   # Verify variables are set
   vercel env ls
   ```

3. **Database Connection**
   - Ensure `DATABASE_URL` is correct
   - Check if database is accessible from Vercel
   - Verify SSL requirements

4. **Function Timeouts**
   - Increase `maxDuration` in `vercel.json`
   - Optimize database queries
   - Use edge functions for better performance

### Performance Optimization

1. **Enable Edge Functions**
   ```json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30,
         "runtime": "nodejs20.x"
       }
     }
   }
   ```

2. **Optimize Images**
   - Use Next.js Image component
   - Configure image domains in `next.config.js`

3. **Caching Strategy**
   - Implement proper caching headers
   - Use Vercel's edge caching

## Next Steps

1. **Set up monitoring** with Sentry or similar
2. **Configure alerts** for errors and performance
3. **Set up staging environment** for testing
4. **Implement CI/CD** with GitHub Actions
5. **Configure backups** for your database

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Your SocialBoost app is now ready for production deployment on Vercel! 🚀** 