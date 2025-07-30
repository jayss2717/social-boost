#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testShopifyInstallation() {
  console.log('🛍️  Shopify App Installation Test\n');

  // Test data
  const testStores = [
    'test-store.myshopify.com',
    'socialboost-test.myshopify.com',
    'demo-store.myshopify.com'
  ];

  console.log('📋 Test Installation URLs:');
  testStores.forEach(store => {
    console.log(`\n🔗 Install URL for ${store}:`);
    console.log(`   ${BASE_URL}/install?shop=${store}`);
    console.log(`   OAuth URL: ${BASE_URL}/api/auth/shopify?shop=${store}`);
  });

  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Create a development store in your Shopify Partner Dashboard');
  console.log('2. Go to your development store admin');
  console.log('3. Navigate to Apps → Develop apps');
  console.log('4. Click "Install app"');
  console.log('5. Or visit the install URL directly');
  console.log('6. Complete the OAuth flow');
  console.log('7. Test all app features');

  console.log('\n🎯 Expected Flow:');
  console.log('1. User visits install page');
  console.log('2. Enters store domain');
  console.log('3. Redirects to Shopify OAuth');
  console.log('4. User authorizes the app');
  console.log('5. Redirects back to your app');
  console.log('6. Creates merchant record');
  console.log('7. Starts onboarding flow');

  console.log('\n🔧 Troubleshooting:');
  console.log('- Ensure your app URL is set to: http://localhost:3000');
  console.log('- Ensure redirect URL is: http://localhost:3000/api/auth/shopify/callback');
  console.log('- Check that all required scopes are configured');
  console.log('- Verify your API key and secret are correct');

  // Test the install page
  console.log('\n🧪 Testing Install Page...');
  try {
    const response = await fetch(`${BASE_URL}/install`);
    if (response.ok) {
      console.log('✅ Install page is accessible');
    } else {
      console.log('❌ Install page returned:', response.status);
    }
  } catch (error) {
    console.log('❌ Error accessing install page:', error.message);
  }

  // Test OAuth URL generation
  console.log('\n🧪 Testing OAuth URL Generation...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/shopify?shop=test-store.myshopify.com`);
    if (response.status === 302) {
      console.log('✅ OAuth URL generation working (redirecting to Shopify)');
    } else {
      console.log('⚠️  OAuth URL returned:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing OAuth URL:', error.message);
  }
}

async function main() {
  console.log('🚀 Shopify App Installation Testing\n');
  
  // Check if server is running
  try {
    const response = await fetch(`${BASE_URL}/api/test`);
    if (response.ok) {
      console.log('✅ Development server is running');
    } else {
      console.log('❌ Development server is not responding');
      return;
    }
  } catch (error) {
    console.log('❌ Development server is not running. Please start it with: npm run dev');
    return;
  }

  await testShopifyInstallation();
  
  console.log('\n🎯 Ready to Test!');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Create a development store in Shopify Partner Dashboard');
  console.log('3. Install your app on the development store');
  console.log('4. Test all features with real Shopify data');
}

main().catch(console.error); 