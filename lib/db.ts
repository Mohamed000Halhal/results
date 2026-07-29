import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  let envUrl = (process.env.DATABASE_URL || '').trim();

  // Strip surrounding quotes if quotes were pasted into environment variables
  if (envUrl.startsWith('"') && envUrl.endsWith('"')) {
    envUrl = envUrl.slice(1, -1).trim();
  }
  if (envUrl.startsWith("'") && envUrl.endsWith("'")) {
    envUrl = envUrl.slice(1, -1).trim();
  }

  if (envUrl && (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://'))) {
    return envUrl;
  }

  // Fallback connection string to ensure Vercel serverless functions never fail
  return "postgresql://postgres.mslbxkseylaccynqgddm:Mohamed500%40%23%24700@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDbUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
