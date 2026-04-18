import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrisma() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ connectionString });
  }
  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({ adapter });
}

const prismaClient = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient;
