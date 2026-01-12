// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // 👇 QUITAMOS 'query' para reducir el ruido en consola
    log: ['error', 'warn'], 
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma