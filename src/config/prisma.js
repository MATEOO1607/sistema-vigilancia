import { PrismaClient } from '@prisma/client';

// Instancia única de Prisma Client para toda la app
export const prisma = new PrismaClient();
