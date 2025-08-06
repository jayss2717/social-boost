import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: 'Starter' },
      update: {},
      create: {
        name: 'Starter',
        priceCents: 0, // Free plan
        ugcLimit: 5,
        influencerLimit: 1,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Pro' },
      update: {},
      create: {
        name: 'Pro',
        priceCents: 2999, // $29.99/month
        ugcLimit: 300,
        influencerLimit: 10,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Scale' },
      update: {},
      create: {
        name: 'Scale',
        priceCents: 6999, // $69.99/month
        ugcLimit: 1000,
        influencerLimit: 50,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'Enterprise' },
      update: {},
      create: {
        name: 'Enterprise',
        priceCents: 0, // Custom pricing
        ugcLimit: -1, // Unlimited
        influencerLimit: -1, // Unlimited
      },
    }),
  ]);

  console.log('✅ Plans created:', plans.map(p => p.name));

  // 🚨 REMOVED: Test merchant creation to prevent duplicate store issues
  // Only create plans, no test merchants
  console.log('✅ Plans created successfully - no test merchants created');
      },
    },
  });

  // 🚨 REMOVED: All test data creation to prevent duplicate store issues
  // Only create plans, no test merchants, influencers, UGC posts, payouts, or discount codes
  console.log('✅ Database seeding completed - only plans created, no test data');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 