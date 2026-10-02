import 'server-only';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { farmPrisma?: PrismaClient };
export const prisma = globalForPrisma.farmPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.farmPrisma = prisma;
