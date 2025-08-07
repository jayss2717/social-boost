import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleSeed() {
  try {
    console.log('🌱 Creating plans...');

    // Create plans one by one
    const starter = await prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        priceCents: 0,
        ugcLimit: 5,
        influencerLimit: 1,
      },
    });
    console.log('✅ Created Starter plan');

    const pro = await prisma.plan.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        priceCents: 2999,
        ugcLimit: 300,
        influencerLimit: 10,
      },
    });
    console.log('✅ Created Pro plan');

    const scale = await prisma.plan.upsert({
      where: { name: 'Scale' },
      update: {},
      create: {
        name: 'Scale',
        priceCents: 6999,
        ugcLimit: 1000,
        influencerLimit: 50,
      },
    });
    console.log('✅ Created Scale plan');

    const enterprise = await prisma.plan.upsert({
      where: { name: 'Enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        priceCents: 0,
        ugcLimit: -1,
        influencerLimit: -1,
      },
    });
    console.log('✅ Created Enterprise plan');

    console.log('🎉 All plans created successfully!');
    console.log('📋 Plans available:');
    console.log(`   - ${starter.name}: $${starter.priceCents/100}/month`);
    console.log(`   - ${pro.name}: $${pro.priceCents/100}/month`);
    console.log(`   - ${scale.name}: $${scale.priceCents/100}/month`);
    console.log(`   - ${enterprise.name}: Custom pricing`);

  } catch (error) {
    console.error('❌ Failed to create plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

simpleSeed(); 