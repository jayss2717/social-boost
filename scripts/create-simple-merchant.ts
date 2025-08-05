import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSimpleMerchant() {
  console.log('Creating simple merchant...');
  
  try {
    // Generate a unique shop name with timestamp
    const timestamp = Date.now();
    const uniqueShop = `simple-shop-${timestamp}.myshopify.com`;

    // Create a test merchant with unique shop name
    const merchant = await prisma.merchant.create({
      data: {
        shop: uniqueShop,
        accessToken: 'test-access-token',
        scope: 'read_products,write_products',
        shopName: 'Simple Test Shop',
        shopEmail: 'simple@example.com',
        shopDomain: uniqueShop,
        shopCurrency: 'USD',
        shopTimezone: 'America/New_York',
        shopLocale: 'en',
        onboardingCompleted: true,
        onboardingStep: 3,
      },
    });

    console.log('✅ Created merchant:', merchant.id);
    console.log('Shop:', uniqueShop);

    console.log('\n=== Simple Merchant Created ===');
    console.log('Merchant ID:', merchant.id);
    console.log('Shop:', uniqueShop);
    console.log('\nTo use this in your app:');
    console.log('1. Open browser console');
    console.log('2. Run: localStorage.setItem("merchantId", "' + merchant.id + '")');
    console.log('3. Refresh the page');
    
  } catch (error) {
    console.error('Error creating merchant:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleMerchant(); 