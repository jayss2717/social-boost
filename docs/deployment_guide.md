# 🚀 Deployment Guide - SocialBoost

## 📋 **Pre-Deployment Checklist**

### **✅ Project Ready:**
- [x] All tests passing (100% app success rate)
- [x] Environment variables configured
- [x] Database schema finalized
- [x] Documentation complete
- [x] Security measures in place

---

## 🔗 **Step 1: GitHub Setup**

### **1. Initialize Git Repository**
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: SocialBoost Shopify app"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/socialboost.git

# Push to GitHub
git push -u origin main
```

### **2. GitHub Repository Settings**
1. **Go to your GitHub repository**
2. **Settings → Pages** (if you want GitHub Pages)
3. **Settings → Secrets and variables → Actions** (for CI/CD)
4. **Settings → Branches** (protect main branch)

### **3. GitHub Actions (Optional)**
Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - run: npm run test:app
```

---

## ⚡ **Step 2: Vercel Deployment**

### **1. Install Vercel CLI**
```bash
npm i -g vercel
```

### **2. Login to Vercel**
```bash
vercel login
```

### **3. Deploy to Vercel**
```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### **4. Configure Environment Variables**
In Vercel Dashboard:
1. **Go to your project**
2. **Settings → Environment Variables**
3. **Add all variables from `.env.example`**

### **5. Custom Domain (Optional)**
```bash
# Add custom domain
vercel domains add yourdomain.com
```

---

## 🎨 **Step 3: Render Deployment**

### **1. Connect GitHub Repository**
1. **Go to Render Dashboard**
2. **New → Web Service**
3. **Connect your GitHub repository**
4. **Select the repository**

### **2. Configure Service**
- **Name**: `socialboost`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### **3. Set Environment Variables**
In Render Dashboard:
- **Environment → Environment Variables**
- **Add all variables from `.env.example`**

### **4. Deploy**
- **Click "Create Web Service"**
- **Render will auto-deploy from GitHub**

---

## 🗄️ **Step 4: Supabase Setup**

### **1. Create Supabase Project**
1. **Go to Supabase Dashboard**
2. **New Project**
3. **Choose organization**
4. **Enter project details**
5. **Set database password**

### **2. Get Database URL**
```bash
# In Supabase Dashboard:
# Settings → Database → Connection string
# Copy the connection string
```

### **3. Update Environment Variables**
```bash
# Update DATABASE_URL in your deployment platforms:
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### **4. Run Database Migrations**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### **5. Verify Database Connection**
```bash
# Test connection
npx prisma studio
```

---

## 🔧 **Step 5: Environment Variables Setup**

### **Production Environment Variables**
Set these in your deployment platforms:

```bash
# Database
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Redis (Optional - can use Upstash)
REDIS_URL="redis://[username]:[password]@[host]:[port]"

# Shopify App
SHOPIFY_API_KEY="your_production_api_key"
SHOPIFY_API_SECRET="your_production_api_secret"
HOST="https://your-app-domain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_SCALE_PRICE_ID="price_..."

# App Configuration
NEXTAUTH_SECRET="your_production_nextauth_secret"
NEXTAUTH_URL="https://your-app-domain.com"

# Optional: Monitoring
SENTRY_DSN="https://your-sentry-dsn"
```

---

## 🧪 **Step 6: Post-Deployment Testing**

### **1. Health Check**
```bash
# Test health endpoint
curl https://your-app-domain.com/api/health
```

### **2. API Endpoints Test**
```bash
# Test all endpoints
curl https://your-app-domain.com/api/test
curl https://your-app-domain.com/api/metrics
curl https://your-app-domain.com/api/subscription
```

### **3. Database Connection Test**
```bash
# Test database
curl https://your-app-domain.com/api/test/database
```

### **4. Shopify Integration Test**
```bash
# Test webhook delivery
shopify app webhook trigger \
  --topic orders/create \
  --address https://your-app-domain.com/api/webhooks/orders-create \
  --api-version 2024-10
```

---

## 🔗 **Step 7: Shopify Production Setup**

### **1. Update Partner Dashboard**
1. **Go to Shopify Partner Dashboard**
2. **Apps → Your App**
3. **App Setup → App URL**: `https://your-app-domain.com`
4. **App Setup → Allowed redirection URL(s)**: `https://your-app-domain.com/api/auth/shopify/callback`

### **2. Configure Production Webhooks**
```bash
# Webhook URLs for production:
# App Uninstalled: https://your-app-domain.com/api/webhooks/app-uninstalled
# Orders Create: https://your-app-domain.com/api/webhooks/orders-create
# Instagram: https://your-app-domain.com/api/webhooks/instagram
# TikTok: https://your-app-domain.com/api/webhooks/tiktok
```

### **3. Test Production Installation**
1. **Create a development store**
2. **Install your app**
3. **Test all features**

---

## 📊 **Step 8: Monitoring Setup**

### **1. Vercel Analytics**
- **Automatic with Vercel deployment**
- **View in Vercel Dashboard**

### **2. Supabase Monitoring**
- **Database performance in Supabase Dashboard**
- **Real-time logs and metrics**

### **3. Custom Monitoring**
```bash
# Health check monitoring
curl https://your-app-domain.com/api/health

# Performance monitoring
curl -w "@curl-format.txt" https://your-app-domain.com/api/test
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. Database Connection Failed**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

#### **2. Build Failed**
```bash
# Check Node.js version
node --version

# Clear cache
npm run build -- --no-cache
```

#### **3. Environment Variables Missing**
```bash
# Verify all required variables are set
# Check deployment platform settings
```

#### **4. Webhook Delivery Failed**
```bash
# Check webhook URLs in Shopify Partner Dashboard
# Verify HTTPS is enabled
# Test webhook manually
```

---

## 🎯 **Deployment Checklist**

### **✅ Pre-Deployment:**
- [ ] All tests passing
- [ ] Environment variables ready
- [ ] Database schema finalized
- [ ] Documentation complete

### **✅ GitHub:**
- [ ] Repository created
- [ ] Code pushed to GitHub
- [ ] Repository settings configured

### **✅ Vercel:**
- [ ] Project deployed
- [ ] Environment variables set
- [ ] Custom domain configured (optional)

### **✅ Render:**
- [ ] Service created
- [ ] Environment variables set
- [ ] Auto-deploy enabled

### **✅ Supabase:**
- [ ] Project created
- [ ] Database URL obtained
- [ ] Migrations applied
- [ ] Connection tested

### **✅ Post-Deployment:**
- [ ] Health checks passing
- [ ] API endpoints working
- [ ] Shopify integration tested
- [ ] Monitoring active

---

## 🎉 **Success!**

Your SocialBoost app is now deployed and ready for production use!

**Next Steps:**
1. **Test with real Shopify stores**
2. **Monitor performance and errors**
3. **Gather user feedback**
4. **Iterate and improve**

**Support:**
- **Documentation**: Check the `docs/` folder
- **Issues**: Create GitHub issues
- **Deployment**: Follow this guide step-by-step 