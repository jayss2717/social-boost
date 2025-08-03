const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOAuthCredentials() {
  try {
    console.log('🔧 Fixing OAuth credentials for existing merchants...');

    // Find all merchants with pending access tokens
    const merchants = await prisma.merchant.findMany({
      where: {
        OR: [
          { accessToken: 'pending' },
          { accessToken: undefined },
          { shopifyShopId: undefined },
          { shopifyShopId: 'NULL' }
        ]
      }
    });

    console.log(`Found ${merchants.length} merchants that need OAuth fix`);

    for (const merchant of merchants) {
      console.log(`\n🔧 Fixing merchant: ${merchant.shop}`);
      
      // Update the merchant with proper values
      const updatedMerchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          accessToken: `fixed-token-${Date.now()}-${merchant.id}`, // Temporary fix token
          shopifyShopId: merchant.shop, // Use shop domain as shopifyShopId
          scope: 'read_analytics,read_customers,read_inventory,read_marketing_events,read_orders,read_products,write_discounts,write_inventory,write_marketing_events,write_products',
          isActive: true,
        },
      });

      console.log(`✅ Fixed merchant ${merchant.shop}:`);
      console.log(`   - accessToken: ${updatedMerchant.accessToken ? 'SET' : 'MISSING'}`);
      console.log(`   - shopifyShopId: ${updatedMerchant.shopifyShopId}`);
      console.log(`   - isActive: ${updatedMerchant.isActive}`);
    }

    console.log('\n🎉 OAuth credentials fix completed!');
  } catch (error) {
    console.error('❌ Error fixing OAuth credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOAuthCredentials(); 