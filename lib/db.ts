import { PrismaClient } from "@prisma/client";

// Next.js dev mode hot-reloads modules on every edit; without this guard each
// reload would open a fresh database connection until SQLite runs out.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
