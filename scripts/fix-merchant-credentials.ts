import { PrismaClient } from '@prisma/client';
import { validateMerchantCredentials, fixMerchantCredentials } from '../lib/merchant-credentials';

const prisma = new PrismaClient();

async function fixAllMerchantCredentials() {
  console.log('🔧 Starting merchant credentials fix...');

  try {
    // Get all merchants
    const merchants = await prisma.merchant.findMany();
    
    console.log(`Found ${merchants.length} merchants`);

    let fixedCount = 0;
    let needsOAuthCount = 0;
    let alreadyValidCount = 0;

    for (const merchant of merchants) {
      console.log(`\nChecking merchant: ${merchant.shop}`);
      console.log(`  - accessToken: ${merchant.accessToken ? '***' : 'NULL/empty'}`);
      console.log(`  - shopifyShopId: ${merchant.shopifyShopId || 'NULL'}`);

      // Check if credentials are valid
      if (validateMerchantCredentials(merchant)) {
        console.log('  ✅ Credentials are already valid');
        alreadyValidCount++;
        continue;
      }

      // Try to fix the credentials
      const result = await fixMerchantCredentials(merchant.shop);
      
      if (result.success) {
        console.log('  ✅ Credentials fixed successfully');
        fixedCount++;
      } else {
        console.log(`  ❌ ${result.message}`);
        needsOAuthCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  - Already valid: ${alreadyValidCount}`);
    console.log(`  - Fixed: ${fixedCount}`);
    console.log(`  - Need OAuth: ${needsOAuthCount}`);
    console.log(`  - Total: ${merchants.length}`);

    if (needsOAuthCount > 0) {
      console.log('\n⚠️  Some merchants need to complete the OAuth flow:');
      const needsOAuth = merchants.filter(m => !validateMerchantCredentials(m));
      needsOAuth.forEach(m => {
        console.log(`    - ${m.shop}`);
      });
    }

  } catch (error) {
    console.error('Error fixing merchant credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixAllMerchantCredentials()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixAllMerchantCredentials }; 