# Shopify Environment Testing Guide

This guide will help you test your SocialBoost app in the actual Shopify environment.

## 🛍️ **Step-by-Step Testing Process**

### **Step 1: Prepare Your Development Environment**

1. **Ensure your app is running:**
   ```bash
   npm run dev
   ```

2. **Verify your environment variables:**
   ```bash
   # Check .env.local has your real credentials
   SHOPIFY_API_KEY=ce4370783ce9d18855fa2073b47f4e71
   SHOPIFY_API_SECRET=2fb46e912e33350df5ed59b11ee7cb00
   HOST=http://localhost:3000
   ```

### **Step 2: Create a Development Store**

1. **Go to Shopify Partner Dashboard**
   - Visit [partners.shopify.com](https://partners.shopify.com)
   - Sign in to your partner account

2. **Create a Development Store**
   - Click **"Stores"** in the left sidebar
   - Click **"Add store"** → **"Development store"**
   - Fill in the details:
     - **Store name**: `SocialBoost Test Store`
     - **Store URL**: Choose a unique subdomain (e.g., `socialboost-test`)
     - **Password**: Set a secure password
     - **Store type**: Development store

### **Step 3: Configure Your App**

1. **Go to your app in Partner Dashboard**
   - Click **"Apps"** → Select your SocialBoost app

2. **Update App Configuration**
   - Go to **"App Setup"**
   - Set **"App URL"** to: `http://localhost:3000`
   - Set **"Allowed redirection URL(s)"** to: `http://localhost:3000/api/auth/shopify/callback`

3. **Configure Admin API Access Scopes**
   - Go to **"Admin API access scopes"**
   - Add these scopes:
     ```
     read_orders
     write_discounts
     read_products
     read_customers
     write_products
     read_inventory
     write_inventory
     read_analytics
     read_marketing_events
     write_marketing_events
     ```

### **Step 4: Install Your App**

#### **Method 1: Through Development Store Admin**
1. **Open your development store admin**
   - Go to your development store URL
   - Sign in with your credentials

2. **Install the App**
   - Go to **"Apps"** → **"Develop apps"**
   - Click **"Install app"**
   - Complete the OAuth flow

#### **Method 2: Direct Installation URL**
1. **Use the install URL:**
   ```
   http://localhost:3000/install?shop=your-store-name.myshopify.com
   ```

2. **Complete the installation:**
   - Enter your store domain
   - Click "Install App"
   - Authorize the app in Shopify

### **Step 5: Test the Complete Flow**

#### **A. OAuth Flow Testing**
1. **Visit the install page:**
   ```
   http://localhost:3000/install
   ```

2. **Enter your development store domain:**
   ```
   your-store-name.myshopify.com
   ```

3. **Complete the OAuth flow:**
   - You'll be redirected to Shopify
   - Authorize the app
   - You'll be redirected back to your app

#### **B. Onboarding Flow Testing**
1. **After OAuth, you should be redirected to onboarding**
2. **Complete the onboarding steps:**
   - Store information
   - Social media accounts
   - Settings configuration

#### **C. Dashboard Testing**
1. **Access the main dashboard:**
   ```
   http://localhost:3000/
   ```

2. **Test all features:**
   - Influencer management
   - UGC posts
   - Analytics
   - Settings

### **Step 6: Test Individual Features**

#### **A. Influencer Management**
1. **Add test influencers**
2. **Set commission rates**
3. **Test influencer profiles**

#### **B. UGC Content Management**
1. **Create test UGC posts**
2. **Test approval workflow**
3. **Test discount code generation**

#### **C. Analytics Dashboard**
1. **View metrics**
2. **Test data visualization**
3. **Check real-time updates**

#### **D. Settings & Configuration**
1. **Test settings page**
2. **Configure webhooks**
3. **Test subscription management**

## 🧪 **Testing Commands**

```bash
# Test all endpoints
npm run test:app

# Test Shopify integration
npm run test:shopify

# Test installation process
npm run test:install

# Start development server
npm run dev
```

## 📋 **Test URLs**

### **Installation URLs:**
- **Install Page**: `http://localhost:3000/install`
- **Test Onboarding**: `http://localhost:3000/test-onboarding`
- **OAuth URL**: `http://localhost:3000/api/auth/shopify?shop=your-store.myshopify.com`

### **App Pages:**
- **Dashboard**: `http://localhost:3000/`
- **Influencers**: `http://localhost:3000/influencers`
- **UGC Posts**: `http://localhost:3000/ugc`
- **Settings**: `http://localhost:3000/settings`
- **Billing**: `http://localhost:3000/billing`

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. OAuth 403 Error**
- **Cause**: Cloudflare protection or incorrect app configuration
- **Solution**: 
  - Verify app URL and redirect URL in Partner Dashboard
  - Check API key and secret are correct
  - Ensure all required scopes are configured

#### **2. App Not Installing**
- **Cause**: Incorrect app configuration
- **Solution**:
  - Verify app URL is set to `http://localhost:3000`
  - Check redirect URL is `http://localhost:3000/api/auth/shopify/callback`
  - Ensure development server is running

#### **3. Webhooks Not Working**
- **Cause**: Local development limitations
- **Solution**:
  - Use ngrok for webhook testing: `ngrok http 3000`
  - Update webhook URLs in Partner Dashboard with ngrok URL

#### **4. Database Issues**
- **Cause**: Database not running or migrations not applied
- **Solution**:
  ```bash
  docker compose up -d db
  npm run db:migrate
  npm run db:seed
  ```

## 🎯 **Expected Test Results**

### **✅ Successful Installation:**
1. **OAuth flow completes without errors**
2. **Merchant record is created in database**
3. **User is redirected to onboarding**
4. **All app features are accessible**
5. **Real Shopify data is available**

### **✅ Successful Feature Testing:**
1. **Influencers can be added and managed**
2. **UGC posts can be created and approved**
3. **Discount codes are generated correctly**
4. **Analytics show real data**
5. **Settings can be configured**

## 🚀 **Production Readiness Checklist**

Before deploying to production:

- [ ] **OAuth flow works end-to-end**
- [ ] **All app features function correctly**
- [ ] **Webhooks are properly configured**
- [ ] **Database migrations are applied**
- [ ] **Environment variables are set**
- [ ] **SSL certificates are configured**
- [ ] **Error handling is implemented**
- [ ] **Logging is configured**

## 📞 **Support**

If you encounter issues:

1. **Check the logs**: `npm run dev`
2. **Verify environment variables**
3. **Test with the provided scripts**
4. **Check Shopify Partner Dashboard configuration**
5. **Review the troubleshooting section above**

## 🎉 **Success!**

Once you complete these steps, your SocialBoost app will be fully functional in the Shopify environment and ready for real-world testing! 