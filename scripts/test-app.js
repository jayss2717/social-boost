#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${name}: PASS`);
      return { success: true, data };
    } else {
      console.log(`❌ ${name}: FAIL - ${response.status} ${response.statusText}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`❌ ${name}: FAIL - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting SocialBoost App Tests...\n');

  // Get a test merchant ID first
  const merchantResponse = await testEndpoint('Create Test Merchant', '/api/test/create-merchant', 'POST', {
    shop: 'test-store.myshopify.com'
  });

  let merchantId = 'cmdpgbpw60003vgpvtdgr4pj5'; // Default test merchant ID
  if (merchantResponse.success && merchantResponse.data.merchant) {
    merchantId = merchantResponse.data.merchant.id;
  }

  const tests = [
    { name: 'Test API', url: '/api/test' },
    { name: 'Metrics API', url: '/api/metrics' },
    { name: 'Subscription API', url: '/api/subscription' },
    { name: 'Influencers API', url: '/api/influencers' },
    { name: 'UGC Posts API', url: '/api/ugc-posts' },
    { 
      name: 'Payouts API', 
      url: '/api/payouts/summary',
      headers: { 'x-merchant-id': merchantId }
    },
    { name: 'Database Test', url: '/api/test/database' },
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, 'GET', null, test.headers);
    results.push({ ...test, ...result });
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.data) {
      console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n🎯 Feature Tests:');
  console.log('1. Dashboard: http://localhost:3000/');
  console.log('2. Test Suite: http://localhost:3000/test');
  console.log('3. Billing Page: http://localhost:3000/billing');

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your app is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/test`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the development server:');
    console.log('   npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  await runAllTests();
}

main().catch(console.error); 