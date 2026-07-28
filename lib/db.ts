import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbPath = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbPath,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Enable WAL mode, memory-mapped I/O, and 64MB cache for sub-millisecond SQLite queries
db.$executeRawUnsafe(`PRAGMA journal_mode = WAL; PRAGMA mmap_size = 300000000; PRAGMA cache_size = -64000; PRAGMA synchronous = NORMAL;`).catch(() => {});

