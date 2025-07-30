# 🚀 Production Deployment Guide for SocialBoost

## 📋 **Pre-Deployment Checklist**

### **✅ Development Phase Complete:**
- [x] All features tested and working
- [x] Database schema finalized
- [x] API endpoints functional
- [x] Webhook handling verified
- [x] Shopify CLI integration working
- [x] Test coverage >85%

---

## 🏗️ **Infrastructure Setup**

### **1. Database Setup**

#### **Option A: Managed PostgreSQL (Recommended)**
```bash
# Examples:
# - Railway: railway add postgresql
# - Supabase: supabase projects create
# - Neon: neon projects create
# - PlanetScale: pscale database create
```

#### **Option B: Self-Hosted PostgreSQL**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb socialboost_prod

# Create user
sudo -u postgres createuser socialboost_user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE socialboost_prod TO socialboost_user;"
```

### **2. Redis Setup**

#### **Option A: Managed Redis**
```bash
# Examples:
# - Railway: railway add redis
# - Upstash: upstash redis create
# - Redis Cloud: redis cloud create
```

#### **Option B: Self-Hosted Redis**
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: bind 127.0.0.1
# Set: requirepass your_redis_password
```

### **3. Hosting Platform Setup**

#### **Option A: Vercel (Recommended for Next.js)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

#### **Option B: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy to Railway
railway up
```

#### **Option C: Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to Netlify
netlify deploy --prod
```

---

## 🔧 **Environment Configuration**

### **1. Production Environment Variables**

Create `.env.production`:
```bash
# Copy from .env.production.example
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

### **2. Required Production Variables:**

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Redis
REDIS_URL="redis://host:port"

# Shopify App (Production)
SHOPIFY_API_KEY="your_production_api_key"
SHOPIFY_API_SECRET="your_production_api_secret"
HOST="https://your-app-domain.com"

# Stripe (Production)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_SCALE_PRICE_ID="price_..."

# App Configuration
NODE_ENV="production"
NEXTAUTH_SECRET="your_production_nextauth_secret"
NEXTAUTH_URL="https://your-app-domain.com"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
```

---

## 🚀 **Deployment Process**

### **1. Prepare for Deployment**

```bash
# Run deployment script
./scripts/deploy.sh production

# Or manually:
npm ci --only=production
npm run build
npx prisma migrate deploy
npx prisma generate
npm run test:app
```

### **2. Deploy to Hosting Platform**

#### **Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add SHOPIFY_API_KEY
# ... add all other variables
```

#### **Railway Deployment:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard
```

### **3. Database Migration**

```bash
# Run migrations on production
npx prisma migrate deploy

# Verify database connection
npx prisma db pull
```

### **4. Verify Deployment**

```bash
# Check health endpoint
curl https://your-app-domain.com/api/health

# Test API endpoints
curl https://your-app-domain.com/api/test

# Check database connection
curl https://your-app-domain.com/api/test/database
```

---

## 🔗 **Shopify Production Setup**

### **1. Update Shopify App Configuration**

1. **Go to Shopify Partner Dashboard**
2. **Navigate to your app**
3. **Update App URL** to your production domain
4. **Update Allowed redirection URL(s)** to production callback URL
5. **Configure webhooks** for production

### **2. Production Webhook Configuration**

```bash
# Webhook URLs for production:
# App Uninstalled: https://your-app-domain.com/api/webhooks/app-uninstalled
# Orders Create: https://your-app-domain.com/api/webhooks/orders-create
# Instagram: https://your-app-domain.com/api/webhooks/instagram
# TikTok: https://your-app-domain.com/api/webhooks/tiktok
```

### **3. Test Production Webhooks**

```bash
# Test webhook delivery to production
shopify app webhook trigger \
  --topic orders/create \
  --address https://your-app-domain.com/api/webhooks/orders-create \
  --api-version 2024-10
```

---

## 📊 **Monitoring & Analytics**

### **1. Health Monitoring**

```bash
# Set up health checks
curl https://your-app-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": true,
    "redis": true,
    "timestamp": "2025-07-30T...",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### **2. Error Tracking (Sentry)**

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  {
    // your existing next config
  },
  {
    // Sentry config
    silent: true,
    org: "your-org",
    project: "socialboost",
  }
);
```

### **3. Performance Monitoring**

```bash
# Set up performance monitoring
# - Vercel Analytics
# - Google Analytics
# - Custom metrics via monitoring.ts
```

---

## 🔒 **Security Checklist**

### **✅ Security Measures:**

- [ ] **Environment Variables**: All secrets in environment variables
- [ ] **HTTPS**: SSL certificate configured
- [ ] **CORS**: Proper CORS configuration
- [ ] **Rate Limiting**: API rate limiting implemented
- [ ] **Input Validation**: All inputs validated
- [ ] **SQL Injection**: Prisma ORM prevents SQL injection
- [ ] **XSS Protection**: Next.js built-in protection
- [ ] **CSRF Protection**: NextAuth.js CSRF protection
- [ ] **Webhook Validation**: HMAC validation for webhooks

### **🔧 Security Configuration:**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

---

## 📈 **Performance Optimization**

### **1. Database Optimization**

```sql
-- Add indexes for better performance
CREATE INDEX idx_merchant_shop ON merchants(shop);
CREATE INDEX idx_ugc_post_merchant ON ugc_posts(merchantId);
CREATE INDEX idx_influencer_merchant ON influencers(merchantId);
CREATE INDEX idx_subscription_merchant ON subscriptions(merchantId);
```

### **2. Caching Strategy**

```typescript
// Implement Redis caching
import { redis } from '@/lib/redis';

export async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const data = await fetchData();
  
  // Cache for 5 minutes
  await redis.setex(key, 300, JSON.stringify(data));
  return data;
}
```

### **3. CDN Configuration**

```bash
# Configure CDN for static assets
# - Vercel Edge Network
# - Cloudflare
# - AWS CloudFront
```

---

## 🧪 **Production Testing**

### **1. Smoke Tests**

```bash
# Test all critical endpoints
curl https://your-app-domain.com/api/test
curl https://your-app-domain.com/api/health
curl https://your-app-domain.com/api/subscription
```

### **2. Load Testing**

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://your-app-domain.com/api/test
```

### **3. End-to-End Testing**

```bash
# Test complete user flows
# 1. App installation
# 2. OAuth flow
# 3. Dashboard access
# 4. Feature usage
# 5. Webhook delivery
```

---

## 📞 **Support & Maintenance**

### **1. Monitoring Setup**

```bash
# Set up alerts for:
# - Database connection failures
# - API response time > 500ms
# - Error rate > 5%
# - Webhook delivery failures
```

### **2. Backup Strategy**

```bash
# Database backups
pg_dump socialboost_prod > backup_$(date +%Y%m%d).sql

# Automated backups
0 2 * * * pg_dump socialboost_prod | gzip > /backups/backup_$(date +%Y%m%d).sql.gz
```

### **3. Update Strategy**

```bash
# Deployment pipeline
git push origin main
# → Triggers automatic deployment
# → Runs tests
# → Deploys to staging
# → Manual approval
# → Deploys to production
```

---

## 🎯 **Post-Deployment Checklist**

### **✅ Verification Steps:**

- [ ] **Health Check**: `/api/health` returns healthy
- [ ] **Database**: All migrations applied successfully
- [ ] **Redis**: Connection working
- [ ] **Shopify App**: Production app URL configured
- [ ] **Webhooks**: All webhooks configured and tested
- [ ] **Stripe**: Production keys configured
- [ ] **Monitoring**: Error tracking and analytics working
- [ ] **SSL**: HTTPS certificate valid
- [ ] **Performance**: API response times < 500ms
- [ ] **Security**: All security measures in place

### **📊 Success Metrics:**

- **Uptime**: >99.9%
- **API Response Time**: <500ms
- **Error Rate**: <1%
- **Webhook Delivery**: >99%
- **Database Performance**: <100ms queries

---

## 🚨 **Emergency Procedures**

### **1. Rollback Process**

```bash
# Quick rollback to previous version
git revert HEAD
./scripts/deploy.sh production

# Or restore from backup
pg_restore backup_20250730.sql
```

### **2. Incident Response**

```bash
# 1. Identify the issue
curl https://your-app-domain.com/api/health

# 2. Check logs
# - Application logs
# - Database logs
# - Webhook logs

# 3. Implement fix
# 4. Deploy fix
# 5. Verify resolution
```

---

**🎉 Congratulations! Your SocialBoost app is now ready for production deployment. Follow this guide step-by-step to ensure a smooth and secure deployment process.** 