import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 1. Obtener URL y limpiarla de espacios accidentales
const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  // Si esto salta en los logs de Vercel, sabremos que la variable NO está llegando
  throw new Error("🔴 CRÍTICO: DATABASE_URL no está definida en las variables de entorno.")
}

// 2. Inicialización Explícita
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: databaseUrl, // 👈 Pasamos la URL limpia manualmente
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma