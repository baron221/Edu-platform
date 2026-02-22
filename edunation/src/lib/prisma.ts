import { PrismaClient } from '@prisma/client';

// Prevent multiple instances during Next.js hot reloads in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
