import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const results = {
    environment: {},
    database: {},
    schema: {},
    permissions: {},
    errors: []
  };

  try {
    // 1. Environment Variables Check
    results.environment = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      HOST: process.env.HOST
    };

    // 2. Database Connection Test
    try {
      const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
      results.database.connection = 'SUCCESS';
      results.database.testQuery = testQuery;
    } catch (error) {
      results.database.connection = 'FAILED';
      results.errors.push(`Database connection: ${error}`);
    }

    // 3. Schema Validation
    try {
      const merchantCount = await prisma.merchant.count();
      results.schema.merchantTable = 'EXISTS';
      results.schema.merchantCount = merchantCount;
    } catch (error) {
      results.schema.merchantTable = 'FAILED';
      results.errors.push(`Schema validation: ${error}`);
    }

    // 4. Write Permission Test
    try {
      const testMerchant = await prisma.merchant.create({
        data: {
          shop: `diagnostic-test-${Date.now()}.myshopify.com`,
          accessToken: 'test-token',
          scope: 'read_products,write_products',
          shopifyShopId: '123456789',
          shopName: 'Diagnostic Test Store',
          shopEmail: 'test@diagnostic.com',
          shopDomain: `diagnostic-test-${Date.now()}.myshopify.com`,
          shopCurrency: 'USD',
          shopTimezone: 'UTC',
          shopLocale: 'en',
          onboardingCompleted: false,
          onboardingStep: 0,
        },
      });
      
      results.permissions.write = 'SUCCESS';
      results.permissions.testMerchantId = testMerchant.id;

      // Clean up
      await prisma.merchant.delete({
        where: { id: testMerchant.id },
      });
      
    } catch (error) {
      results.permissions.write = 'FAILED';
      results.errors.push(`Write permission: ${error}`);
    }

    // 5. Upsert Test (the actual operation that's failing)
    try {
      const testShop = `upsert-test-${Date.now()}.myshopify.com`;
      
      const upsertResult = await prisma.merchant.upsert({
        where: { shop: testShop },
        update: {
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: { test: 'data' },
        },
        create: {
          shop: testShop,
          accessToken: 'test-token',
          scope: 'read_products,write_products',
          shopifyShopId: '123456789',
          shopName: 'Upsert Test Store',
          shopEmail: 'test@upsert.com',
          shopDomain: testShop,
          shopCurrency: 'USD',
          shopTimezone: 'UTC',
          shopLocale: 'en',
          onboardingCompleted: true,
          onboardingStep: 5,
          onboardingData: { test: 'data' },
        },
      });
      
      results.permissions.upsert = 'SUCCESS';
      results.permissions.upsertMerchantId = upsertResult.id;

      // Clean up
      await prisma.merchant.delete({
        where: { id: upsertResult.id },
      });
      
    } catch (error) {
      results.permissions.upsert = 'FAILED';
      results.errors.push(`Upsert operation: ${error}`);
    }

    return NextResponse.json({
      success: true,
      diagnostic: results,
      summary: {
        environmentOk: results.environment.DATABASE_URL,
        databaseOk: results.database.connection === 'SUCCESS',
        schemaOk: results.schema.merchantTable === 'EXISTS',
        writeOk: results.permissions.write === 'SUCCESS',
        upsertOk: results.permissions.upsert === 'SUCCESS',
        errorCount: results.errors.length
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      diagnostic: results
    }, { status: 500 });
  }
} 