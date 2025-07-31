import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  try {
    console.log('🌱 Seeding plans...');

    // Clear existing plans
    await prisma.plan.deleteMany();

    // Create plans
    const plans = [
      {
        name: 'STARTER',
        priceCents: 0,
        ugcLimit: 5,
        influencerLimit: 1,
      },
      {
        name: 'PRO',
        priceCents: 1999, // $19.99
        ugcLimit: 300,
        influencerLimit: 10,
      },
      {
        name: 'SCALE',
        priceCents: 5999, // $59.99
        ugcLimit: 1000,
        influencerLimit: 50,
      },
      {
        name: 'ENTERPRISE',
        priceCents: 0, // Custom pricing
        ugcLimit: -1, // Unlimited
        influencerLimit: -1, // Unlimited
      },
    ];

    for (const plan of plans) {
      await prisma.plan.create({
        data: plan,
      });
      console.log(`✅ Created plan: ${plan.name}`);
    }

    console.log('🎉 Plans seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlans(); 