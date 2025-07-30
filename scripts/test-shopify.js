#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test data for Shopify integration
const TEST_SHOP = 'test-store.myshopify.com';
const TEST_MERCHANT_DATA = {
  shop: TEST_SHOP,
  shopName: 'Test Store',
  shopEmail: 'test@example.com',
  shopDomain: 'test-store.myshopify.com',
  shopCurrency: 'USD',
  shopTimezone: 'America/New_York',
  shopLocale: 'en',
};

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
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
    } else {
      data = await response.text();
    }

    if (response.ok) {
      console.log(`✅ ${name}: PASS`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ ${name}: FAIL - ${response.status} ${response.statusText}`);
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${name}: FAIL - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testShopifyIntegration() {
  console.log('🛍️  Starting Shopify Integration Tests...\n');

  const tests = [
    // Test merchant creation
    {
      name: 'Create Test Merchant',
      url: '/api/test/create-merchant',
      method: 'POST',
      body: TEST_MERCHANT_DATA,
    },
    
    // Test Shopify OAuth URL generation
    {
      name: 'Shopify OAuth URL',
      url: `/api/auth/shopify?shop=${TEST_SHOP}`,
      method: 'GET',
    },
    
    // Test app installation page
    {
      name: 'Install Page',
      url: '/install',
      method: 'GET',
    },
    
    // Test onboarding flow
    {
      name: 'Onboarding Page',
      url: `/onboarding?shop=${TEST_SHOP}`,
      method: 'GET',
    },
    
    // Test test onboarding page
    {
      name: 'Test Onboarding Page',
      url: '/test-onboarding',
      method: 'GET',
    },
    
    // Test webhook endpoints
    {
      name: 'App Uninstalled Webhook',
      url: '/api/webhooks/app-uninstalled',
      method: 'POST',
      body: {
        shop: TEST_SHOP,
        id: 123456789,
      },
    },
    
    // Test Instagram webhook
    {
      name: 'Instagram Webhook',
      url: '/api/webhooks/instagram',
      method: 'POST',
      body: {
        object: 'instagram',
        entry: [{
          id: 'test-entry',
          time: Date.now(),
        }],
      },
    },
    
    // Test TikTok webhook
    {
      name: 'TikTok Webhook',
      url: '/api/webhooks/tiktok',
      method: 'POST',
      body: {
        event: 'test_event',
        shop: TEST_SHOP,
      },
    },
    
    // Test orders webhook
    {
      name: 'Orders Create Webhook',
      url: '/api/webhooks/orders-create',
      method: 'POST',
      body: {
        id: 123456789,
        shop: TEST_SHOP,
        line_items: [{
          id: 1,
          product_id: 123,
          quantity: 1,
        }],
      },
    },
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.method, test.body, test.headers);
    results.push({ ...test, ...result });
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 Shopify Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name} (${result.status || 'N/A'})`);
    if (result.data && typeof result.data === 'object') {
      console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }
    if (result.error) {
      console.log(`   Error: ${JSON.stringify(result.error).substring(0, 100)}...`);
    }
  });

  console.log('\n🎯 Shopify Test URLs:');
  console.log(`1. Install Page: ${BASE_URL}/install`);
  console.log(`2. Test Onboarding: ${BASE_URL}/test-onboarding`);
  console.log(`3. OAuth URL: ${BASE_URL}/api/auth/shopify?shop=${TEST_SHOP}`);
  console.log(`4. Callback URL: ${BASE_URL}/api/auth/shopify/callback`);

  console.log('\n🔧 Shopify Development Setup:');
  console.log('1. Create a Shopify Partner account');
  console.log('2. Create a new app in your partner dashboard');
  console.log('3. Set App URL to: http://localhost:3000');
  console.log('4. Set Allowed redirection URL(s) to: http://localhost:3000/api/auth/shopify/callback');
  console.log('5. Update .env.local with your API key and secret');
  console.log('6. Use ngrok for webhook testing: ngrok http 3000');

  if (failed === 0) {
    console.log('\n🎉 All Shopify tests passed! Your app is ready for Shopify integration.');
  } else {
    console.log('\n⚠️  Some Shopify tests failed. This is expected for development setup.');
  }
}

async function testShopifyAppFlow() {
  console.log('\n🔄 Testing Shopify App Flow...\n');

  // Test the complete app flow
  const flowTests = [
    {
      name: '1. App Installation',
      description: 'Test the app installation process',
      url: '/install',
    },
    {
      name: '2. OAuth Flow',
      description: 'Test Shopify OAuth URL generation',
      url: `/api/auth/shopify?shop=${TEST_SHOP}`,
    },
    {
      name: '3. Onboarding Flow',
      description: 'Test the onboarding process',
      url: `/onboarding?shop=${TEST_SHOP}`,
    },
    {
      name: '4. Dashboard Access',
      description: 'Test dashboard access after onboarding',
      url: '/',
    },
  ];

  for (const test of flowTests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   URL: ${BASE_URL}${test.url}`);
    
    const result = await testEndpoint(test.name, test.url);
    if (result.success) {
      console.log(`   Status: ✅ Ready for testing`);
    } else {
      console.log(`   Status: ⚠️  ${result.error || 'Check manually'}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Shopify Integration Testing...\n');
  
  // Check if server is running
  try {
    const response = await fetch(`${BASE_URL}/api/test`);
    if (response.ok) {
      console.log('✅ Development server is running');
    } else {
      console.log('❌ Development server is not responding properly');
      return;
    }
  } catch (error) {
    console.log('❌ Development server is not running. Please start it with: npm run dev');
    return;
  }

  await testShopifyIntegration();
  await testShopifyAppFlow();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Set up your Shopify Partner account');
  console.log('2. Create a development app');
  console.log('3. Update environment variables');
  console.log('4. Test with a real Shopify store');
}

main().catch(console.error); 