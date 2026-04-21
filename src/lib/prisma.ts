import { PrismaClient } from "@prisma/client";

// ⚠️  WARNING: Do NOT import this in feature code.
// Feature code must use tenantDb(tenantId) from '@/lib/tenant/prisma'
// to ensure tenant isolation. Using this raw client in feature code
// is a P0 data leak vulnerability.
// Only import this for: Tenant model itself, User during signup, migrations, seeds.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
