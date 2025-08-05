import { PrismaClient } from '@prisma/client';

// Global variable to prevent multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with connection pooling and retry logic
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pooling configuration
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Use global instance in development to prevent multiple connections
export const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

// Add graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Add error handling for connection issues
prisma.$use(async (params, next) => {
  const start = Date.now();
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    
    // Log slow queries in production
    if (duration > 1000 && process.env.NODE_ENV === 'production') {
      console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error(`Database error in ${params.model}.${params.action}:`, error);
    
    // Retry logic for connection errors
    if (error instanceof Error && error.message.includes('prepared statement')) {
      console.log('Retrying database operation due to connection issue...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return next(params);
    }
    
    throw error;
  }
}); 