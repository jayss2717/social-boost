import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // Create a test plan first
    const starterPlan = await prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        priceCents: 0, // Free plan
        ugcLimit: 5,
        influencerLimit: 1,
      },
    });

    console.log('Created/updated Starter plan:', starterPlan.id);

    // 🚨 REMOVED: Test merchant creation to prevent duplicate store issues
    console.log('✅ Only plans created - no test merchants');
    console.log('\n=== Test Data Setup Complete ===');
    console.log('Plan:', starterPlan.name);
    console.log('\nNo test merchants created to prevent conflicts with real stores');
    
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData(); 