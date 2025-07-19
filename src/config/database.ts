import { PrismaClient } from '@prisma/client';
import { config } from './config';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with logging configuration
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: config.isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['info', 'warn', 'error'],
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });
};

// Singleton pattern for Prisma client
export const prisma = globalThis.__prisma || createPrismaClient();

// In development, store the client globally to prevent re-initialization
if (config.isDevelopment) {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
