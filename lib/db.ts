import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const defaultPath = path.join(process.cwd(), 'prisma', 'dev.db');
  
  // On Vercel / Serverless, if db file exists in tmp or root
  const tmpPath = path.join('/tmp', 'dev.db');
  if (process.env.VERCEL && fs.existsSync(defaultPath) && !fs.existsSync(tmpPath)) {
    try {
      fs.copyFileSync(defaultPath, tmpPath);
      return `file:${tmpPath}`;
    } catch {
      // Fallback if copy fails
    }
  }

  if (process.env.VERCEL && fs.existsSync(tmpPath)) {
    return `file:${tmpPath}`;
  }

  return `file:${defaultPath}`;
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

// Enable WAL mode & performance PRAGMAs safely
if (!process.env.VERCEL) {
  db.$executeRawUnsafe(`PRAGMA journal_mode = WAL; PRAGMA mmap_size = 300000000; PRAGMA cache_size = -64000; PRAGMA synchronous = NORMAL;`).catch(() => {});
}
