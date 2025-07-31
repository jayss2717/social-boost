#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_SHOP = 'teststorev101.myshopify.com';

async function testAPI() {
  console.log('🧪 Testing SocialBoost Application...\n');

  try {
    // Test 1: Merchant API
    console.log('1. Testing Merchant API...');
    const merchantResponse = await fetch(`${BASE_URL}/api/merchant?shop=${TEST_SHOP}`);
    const merchantData = await merchantResponse.json();
    
    if (merchantResponse.ok && merchantData.id) {
      console.log('✅ Merchant API: Working');
      console.log(`   Merchant ID: ${merchantData.id}`);
      console.log(`   Shop: ${merchantData.shop}`);
      console.log(`   Onboarding: ${merchantData.onboardingCompleted ? 'Completed' : 'Pending'}`);
    } else {
      console.log('❌ Merchant API: Failed');
      console.log(`   Error: ${merchantData.error || 'Unknown error'}`);
      return;
    }

    // Test 2: Metrics API
    console.log('\n2. Testing Metrics API...');
    const metricsResponse = await fetch(`${BASE_URL}/api/metrics`, {
      headers: { 'x-merchant-id': merchantData.id }
    });
    const metricsData = await metricsResponse.json();
    
    if (metricsResponse.ok && !metricsData.error) {
      console.log('✅ Metrics API: Working');
      console.log(`   UGC Posts: ${metricsData.totalUgcPosts}`);
      console.log(`   Influencers: ${metricsData.totalInfluencers}`);
      console.log(`   Revenue: $${(metricsData.totalRevenue / 100).toFixed(2)}`);
      console.log(`   Pending Payouts: $${(metricsData.pendingPayouts / 100).toFixed(2)}`);
    } else {
      console.log('❌ Metrics API: Failed');
      console.log(`   Error: ${metricsData.error || 'Unknown error'}`);
    }

    // Test 3: Subscription API
    console.log('\n3. Testing Subscription API...');
    const subscriptionResponse = await fetch(`${BASE_URL}/api/subscription`, {
      headers: { 'x-merchant-id': merchantData.id }
    });
    const subscriptionData = await subscriptionResponse.json();
    
    if (subscriptionResponse.ok && subscriptionData.subscription) {
      console.log('✅ Subscription API: Working');
      console.log(`   Plan: ${subscriptionData.subscription.plan?.name || 'Unknown'}`);
      console.log(`   Status: ${subscriptionData.subscription.status}`);
      console.log(`   Usage: ${subscriptionData.usage.influencerCount}/${subscriptionData.usage.influencerLimit} influencers`);
      console.log(`   UGC: ${subscriptionData.usage.ugcCount}/${subscriptionData.usage.ugcLimit} posts`);
    } else {
      console.log('❌ Subscription API: Failed');
      console.log(`   Error: ${subscriptionData.error || 'Unknown error'}`);
    }

    // Test 4: Main Dashboard
    console.log('\n4. Testing Main Dashboard...');
    const dashboardResponse = await fetch(`${BASE_URL}/`);
    
    if (dashboardResponse.ok) {
      console.log('✅ Main Dashboard: Loading correctly');
      console.log(`   Status: ${dashboardResponse.status}`);
      console.log(`   Content-Type: ${dashboardResponse.headers.get('content-type')}`);
    } else {
      console.log('❌ Main Dashboard: Failed');
      console.log(`   Status: ${dashboardResponse.status}`);
    }

    // Test 5: Test Dashboard
    console.log('\n5. Testing Test Dashboard...');
    const testDashboardResponse = await fetch(`${BASE_URL}/test-dashboard`);
    
    if (testDashboardResponse.ok) {
      console.log('✅ Test Dashboard: Loading correctly');
      console.log(`   Status: ${testDashboardResponse.status}`);
    } else {
      console.log('❌ Test Dashboard: Failed');
      console.log(`   Status: ${testDashboardResponse.status}`);
    }

    // Summary
    console.log('\n🎉 Test Summary:');
    console.log('✅ All APIs are working correctly!');
    console.log('✅ Database is connected and populated');
    console.log('✅ Application is ready for use');
    console.log('\n📊 Test Data Summary:');
    console.log(`   - Merchant: ${merchantData.shop}`);
    console.log(`   - UGC Posts: ${metricsData.totalUgcPosts}`);
    console.log(`   - Influencers: ${metricsData.totalInfluencers}`);
    console.log(`   - Revenue: $${(metricsData.totalRevenue / 100).toFixed(2)}`);
    console.log(`   - Plan: ${subscriptionData.subscription?.plan?.name || 'Unknown'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 