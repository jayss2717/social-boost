# 🧪 Production Manual Testing Guide for SocialBoost

## 📋 **Testing Overview**

This comprehensive manual testing guide covers all aspects of the SocialBoost Shopify app to ensure production readiness. The app includes influencer management, UGC tracking, subscription billing, analytics, and social media integrations.

---

## 🚀 **Pre-Testing Setup**

### **1. Environment Preparation**

```bash
# Start the development environment
npm run dev

# Start database (if using Docker)
docker-compose up -d

# Verify all services are running
curl http://localhost:3000/api/health
```

### **2. Test Data Setup**

```bash
# Create test merchant
npm run script:create-simple-merchant

# Seed test data
npm run script:setup-test-data

# Verify database connection
npm run script:verify-build
```

---

## 🎯 **Core Feature Testing**

### **1. App Installation & Onboarding**

#### **A. Shopify App Store Installation**
1. **Navigate to your development store**
   - URL: `https://your-dev-store.myshopify.com/admin`
   - Go to Apps → Find apps for your store

2. **Install SocialBoost**
   - Search for "SocialBoost" in the app store
   - Click "Add app" or "Install app"
   - Authorize required permissions:
     - ✅ Read products
     - ✅ Read orders
     - ✅ Write discount codes
     - ✅ Read customers

3. **Complete Onboarding Flow**
   - Verify redirect to onboarding page
   - Fill out merchant information
   - Connect social media accounts (optional)
   - Complete subscription selection
   - Verify dashboard access

#### **B. OAuth Flow Testing**
```bash
# Test OAuth endpoints
curl -X GET "http://localhost:3000/api/auth/shopify?shop=test-store.myshopify.com"

# Test callback handling
curl -X GET "http://localhost:3000/api/auth/shopify/callback?code=test_code&shop=test-store.myshopify.com"
```

**Expected Results:**
- ✅ Successful app installation
- ✅ Proper OAuth flow completion
- ✅ Merchant record creation in database
- ✅ Redirect to dashboard after onboarding

### **2. Dashboard & Analytics**

#### **A. Main Dashboard Testing**
1. **Access Dashboard**
   - URL: `http://localhost:3000/`
   - Verify merchant ID is set in localStorage
   - Check for proper data loading

2. **Test Dashboard Components**
   - **Metrics Cards**: Revenue, UGC posts, influencers, discount codes
   - **Usage Meter**: Current plan limits vs usage
   - **Recent Activity**: Latest UGC posts and payouts
   - **Quick Actions**: Add influencer, view UGC, process payouts

3. **Test Responsive Design**
   - Mobile view (320px width)
   - Tablet view (768px width)
   - Desktop view (1024px+ width)

#### **B. Analytics Testing**
```bash
# Test metrics API
curl -X GET "http://localhost:3000/api/metrics?shop=test-store.myshopify.com&period=30d"

# Test different time periods
curl -X GET "http://localhost:3000/api/metrics?shop=test-store.myshopify.com&period=7d"
curl -X GET "http://localhost:3000/api/metrics?shop=test-store.myshopify.com&period=90d"
```

**Expected Results:**
- ✅ Dashboard loads without errors
- ✅ All metrics display correctly
- ✅ Responsive design works on all devices
- ✅ Real-time data updates

### **3. Influencer Management**

#### **A. Influencer CRUD Operations**
1. **Add New Influencer**
   - Navigate to `/influencers`
   - Click "Add Influencer"
   - Fill required fields:
     - Name, email, social handles
     - Commission rate (5-30%)
     - Platform preferences
   - Verify influencer appears in list

2. **Edit Influencer**
   - Click on existing influencer
   - Modify commission rate
   - Update social media handles
   - Verify changes persist

3. **Generate Discount Codes**
   - Select influencer
   - Click "Generate Code"
   - Verify code creation in Shopify
   - Check code appears in dashboard

#### **B. Commission Tracking**
```bash
# Test influencer API
curl -X GET "http://localhost:3000/api/influencers" \
  -H "x-merchant-id: test-merchant-id"

# Test discount code generation
curl -X POST "http://localhost:3000/api/discount-codes" \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: test-merchant-id" \
  -d '{"influencerId":"test-id","code":"TEST10","discount":10}'
```

**Expected Results:**
- ✅ Influencer creation/editing works
- ✅ Commission calculations are accurate
- ✅ Discount codes sync with Shopify
- ✅ Performance tracking functions

### **4. UGC (User Generated Content) Management**

#### **A. UGC Post Workflow**
1. **View UGC Posts**
   - Navigate to `/ugc`
   - Verify posts are displayed
   - Test filtering by platform (Instagram, TikTok)
   - Test sorting by date, engagement

2. **Approve/Reject Posts**
   - Select a UGC post
   - Click "Approve" or "Reject"
   - Verify status updates
   - Check reward assignment

3. **Reward Assignment**
   - Approve a UGC post
   - Assign reward amount
   - Verify payout calculation
   - Check influencer notification

#### **B. UGC Detection Testing**
```bash
# Test UGC detection API
curl -X POST "http://localhost:3000/api/ugc-posts/detect" \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: test-merchant-id" \
  -d '{"platform":"instagram","postId":"test-post","content":"test content"}'

# Test UGC approval
curl -X POST "http://localhost:3000/api/ugc-posts/approve/test-post-id" \
  -H "x-merchant-id: test-merchant-id"
```

**Expected Results:**
- ✅ UGC posts display correctly
- ✅ Approval/rejection workflow works
- ✅ Rewards are calculated accurately
- ✅ Platform filtering functions

### **5. Subscription & Billing**

#### **A. Plan Management**
1. **View Current Plan**
   - Navigate to `/billing`
   - Verify current plan details
   - Check usage limits vs actual usage
   - Review billing history

2. **Upgrade Plan**
   - Click "Upgrade Plan"
   - Select Pro or Scale plan
   - Complete Stripe checkout
   - Verify plan change in database

3. **Downgrade Plan**
   - Click "Change Plan"
   - Select lower tier plan
   - Verify usage doesn't exceed new limits
   - Confirm downgrade

#### **B. Payment Processing**
```bash
# Test subscription upgrade
curl -X POST "http://localhost:3000/api/subscription/upgrade" \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: test-merchant-id" \
  -d '{"plan":"Pro"}'

# Test subscription status
curl -X GET "http://localhost:3000/api/subscription" \
  -H "x-merchant-id: test-merchant-id"
```

**Expected Results:**
- ✅ Plan details display correctly
- ✅ Stripe checkout works
- ✅ Plan changes reflect immediately
- ✅ Usage limits are enforced

### **6. Payout Processing**

#### **A. Payout Workflow**
1. **View Payouts**
   - Navigate to `/payouts`
   - Check pending payouts
   - Review payout history
   - Verify commission calculations

2. **Process Payouts**
   - Select pending payouts
   - Click "Process Payout"
   - Verify Stripe transfer creation
   - Check payout status updates

3. **Bulk Processing**
   - Select multiple payouts
   - Use bulk process feature
   - Verify all transfers complete
   - Check error handling

#### **B. Stripe Integration**
```bash
# Test payout processing
curl -X POST "http://localhost:3000/api/payouts/bulk-process" \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: test-merchant-id" \
  -d '{"payoutIds":["test-id-1","test-id-2"]}'

# Test payout summary
curl -X GET "http://localhost:3000/api/payouts/summary" \
  -H "x-merchant-id: test-merchant-id"
```

**Expected Results:**
- ✅ Payout calculations are accurate
- ✅ Stripe transfers complete successfully
- ✅ Payout status updates correctly
- ✅ Error handling works for failed transfers

### **7. Social Media Integration**

#### **A. Instagram Integration**
1. **Connect Instagram Account**
   - Navigate to Settings → Social Media
   - Click "Connect Instagram"
   - Complete OAuth flow
   - Verify account connection

2. **Test Instagram Webhooks**
   - Post content with brand mention
   - Verify webhook receives event
   - Check UGC post creation
   - Test engagement tracking

#### **B. TikTok Integration**
1. **Connect TikTok Account**
   - Navigate to Settings → Social Media
   - Click "Connect TikTok"
   - Complete OAuth flow
   - Verify account connection

2. **Test TikTok Webhooks**
   - Create TikTok content with brand mention
   - Verify webhook receives event
   - Check UGC post creation
   - Test engagement tracking

#### **C. Webhook Testing**
```bash
# Test Instagram webhook
curl -X POST "http://localhost:3000/api/webhooks/instagram" \
  -H "Content-Type: application/json" \
  -d '{"object":"instagram","entry":[{"id":"test-id","time":1234567890}]}'

# Test TikTok webhook
curl -X POST "http://localhost:3000/api/webhooks/tiktok" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"video_upload","data":{"video_id":"test-video"}}'
```

**Expected Results:**
- ✅ Social media connections work
- ✅ Webhooks receive and process events
- ✅ UGC posts are created from social content
- ✅ Engagement metrics are tracked

### **8. Settings & Configuration**

#### **A. Merchant Settings**
1. **Update Profile**
   - Navigate to `/settings`
   - Update store information
   - Modify commission rates
   - Save changes

2. **Social Media Configuration**
   - Connect/update social accounts
   - Configure webhook settings
   - Test API connections

3. **Notification Settings**
   - Configure email notifications
   - Set up webhook alerts
   - Test notification delivery

#### **B. API Testing**
```bash
# Test settings update
curl -X PUT "http://localhost:3000/api/settings" \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: test-merchant-id" \
  -d '{"commissionRate":15,"notifications":true}'

# Test social media connection
curl -X POST "http://localhost:3000/api/social-media/connect" \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: test-merchant-id" \
  -d '{"platform":"instagram","accountId":"test-id","username":"test-user"}'
```

**Expected Results:**
- ✅ Settings save correctly
- ✅ Social media connections work
- ✅ Notifications are delivered
- ✅ Configuration persists

---

## 🔧 **Advanced Testing Scenarios**

### **1. Error Handling & Edge Cases**

#### **A. Network Failures**
1. **Simulate API Timeouts**
   - Disconnect internet during API calls
   - Verify error messages display
   - Test retry mechanisms
   - Check graceful degradation

2. **Database Connection Issues**
   - Stop database service
   - Verify error handling
   - Test reconnection logic
   - Check data integrity

#### **B. Invalid Data Handling**
1. **Malformed API Requests**
   - Send invalid JSON
   - Test missing required fields
   - Verify validation errors
   - Check error response format

2. **Stripe Payment Failures**
   - Use test card numbers for failures
   - Test insufficient funds scenarios
   - Verify error handling
   - Check retry logic

### **2. Performance Testing**

#### **A. Load Testing**
```bash
# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s \
  "http://localhost:3000/api/metrics?shop=test-store.myshopify.com"

# Test concurrent requests
ab -n 100 -c 10 http://localhost:3000/api/test
```

#### **B. Database Performance**
1. **Large Dataset Handling**
   - Create 1000+ test records
   - Test query performance
   - Verify pagination works
   - Check memory usage

2. **Concurrent Operations**
   - Multiple users accessing dashboard
   - Simultaneous payout processing
   - Concurrent UGC approvals
   - Verify data consistency

### **3. Security Testing**

#### **A. Authentication & Authorization**
1. **Merchant ID Validation**
   - Test with invalid merchant ID
   - Verify access denied
   - Check error messages
   - Test session handling

2. **API Security**
   - Test unauthorized access
   - Verify CORS settings
   - Check CSRF protection
   - Test rate limiting

#### **B. Data Protection**
1. **Sensitive Data Handling**
   - Verify API keys are not exposed
   - Check PII protection
   - Test data encryption
   - Verify GDPR compliance

### **4. Integration Testing**

#### **A. Shopify Integration**
1. **App Installation Flow**
   - Test fresh installation
   - Test app reinstallation
   - Verify data migration
   - Check uninstall cleanup

2. **Shopify API Calls**
   - Test product fetching
   - Verify order processing
   - Check discount code creation
   - Test customer data access

#### **B. Stripe Integration**
1. **Payment Processing**
   - Test successful payments
   - Test failed payments
   - Verify webhook handling
   - Check refund processing

2. **Payout Processing**
   - Test successful transfers
   - Test failed transfers
   - Verify webhook handling
   - Check error recovery

---

## 📊 **Testing Checklist**

### **✅ Core Functionality**
- [ ] App installation and OAuth flow
- [ ] Dashboard loading and navigation
- [ ] Influencer management (CRUD)
- [ ] UGC post management
- [ ] Subscription and billing
- [ ] Payout processing
- [ ] Social media integration
- [ ] Settings and configuration

### **✅ API Endpoints**
- [ ] All GET endpoints return correct data
- [ ] All POST endpoints create/update data
- [ ] All PUT endpoints update data
- [ ] All DELETE endpoints remove data
- [ ] Error handling for all endpoints
- [ ] Authentication for protected endpoints

### **✅ Webhooks**
- [ ] Instagram webhook receives events
- [ ] TikTok webhook receives events
- [ ] Shopify webhooks (orders, app uninstalled)
- [ ] Stripe webhooks (payments, transfers)
- [ ] Webhook signature validation
- [ ] Webhook error handling

### **✅ Database Operations**
- [ ] Data creation and retrieval
- [ ] Data updates and deletions
- [ ] Relationship queries work
- [ ] Transaction handling
- [ ] Data integrity constraints
- [ ] Migration rollbacks

### **✅ UI/UX**
- [ ] Responsive design on all devices
- [ ] Loading states and error messages
- [ ] Form validation and submission
- [ ] Navigation and routing
- [ ] Accessibility compliance
- [ ] Cross-browser compatibility

### **✅ Performance**
- [ ] Page load times under 3 seconds
- [ ] API response times under 500ms
- [ ] Database query optimization
- [ ] Memory usage monitoring
- [ ] Concurrent user handling
- [ ] Error recovery mechanisms

---

## 🚨 **Common Issues & Solutions**

### **1. OAuth Flow Issues**
**Problem**: 403 Forbidden during app installation
**Solution**: 
- Verify Shopify app credentials in environment variables
- Check redirect URLs in Shopify Partner dashboard
- Ensure proper scopes are configured

### **2. Database Connection Issues**
**Problem**: Database connection failures
**Solution**:
```bash
# Restart database
docker-compose restart db

# Check database status
docker ps | grep postgres

# Verify connection
npm run script:verify-build
```

### **3. Stripe Integration Issues**
**Problem**: Payment processing failures
**Solution**:
- Verify Stripe API keys in environment variables
- Check webhook endpoint configuration
- Test with Stripe test mode
- Verify webhook signature validation

### **4. Webhook Delivery Issues**
**Problem**: Webhooks not being received
**Solution**:
- Use ngrok for local testing
- Verify webhook endpoints are accessible
- Check HMAC signature validation
- Test with Shopify CLI webhook triggers

---

## 📈 **Success Metrics**

### **Performance Benchmarks**
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Webhook Processing**: < 1 second
- **Error Rate**: < 1%

### **Functionality Requirements**
- **App Installation**: 100% success rate
- **OAuth Flow**: Complete without errors
- **Data Persistence**: All CRUD operations work
- **Payment Processing**: Successful Stripe integration
- **Webhook Delivery**: 100% event processing

---

## 🎯 **Post-Testing Actions**

### **1. Issue Documentation**
- Document all found issues
- Prioritize by severity (Critical, High, Medium, Low)
- Create detailed bug reports
- Assign to development team

### **2. Performance Optimization**
- Identify slow queries
- Optimize database indexes
- Implement caching strategies
- Monitor resource usage

### **3. Security Review**
- Audit authentication flows
- Review data protection measures
- Test vulnerability scenarios
- Verify compliance requirements

### **4. Production Deployment**
- Configure production environment
- Set up monitoring and logging
- Implement error tracking
- Deploy with confidence

---

## 📞 **Support Resources**

### **Useful Commands**
```bash
# Start development environment
npm run dev

# Run all tests
npm run test:app && npm run test:shopify

# Check app status
shopify app info

# View logs
shopify app logs

# Deploy to production
npm run deploy
```

### **Documentation Links**
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js Documentation](https://nextjs.org/docs)

---

**🎉 Your SocialBoost app is now ready for comprehensive manual testing! Follow this guide to ensure all features work perfectly before production deployment.** 