import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initialized: boolean | undefined;
};

function getDbUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / Serverless, use /tmp/dev.db which is writable
  if (process.env.VERCEL) {
    const tmpPath = path.join('/tmp', 'dev.db');
    const defaultPath = path.join(process.cwd(), 'prisma', 'dev.db');

    if (fs.existsSync(defaultPath) && !fs.existsSync(tmpPath)) {
      try {
        fs.copyFileSync(defaultPath, tmpPath);
      } catch {
        // Fallthrough if copy fails
      }
    }

    return `file:${tmpPath}`;
  }

  const defaultPath = path.join(process.cwd(), 'prisma', 'dev.db');
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

// Automatically initialize SQLite tables on startup if missing
if (!globalForPrisma.initialized) {
  globalForPrisma.initialized = true;
  
  const initSql = `
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      seat_number TEXT NOT NULL,
      result TEXT NOT NULL,
      percentage REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS results_seat_number_idx ON results(seat_number);
    CREATE INDEX IF NOT EXISTS results_name_idx ON results(name);
    CREATE INDEX IF NOT EXISTS results_normalized_name_idx ON results(normalized_name);

    CREATE TABLE IF NOT EXISTS system_stats (
      id TEXT PRIMARY KEY,
      visitor_count INTEGER DEFAULT 0,
      last_imported_file TEXT,
      last_import_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS unique_visitors (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Split and execute SQL statements safely
  const statements = initSql.split(';').map(s => s.trim()).filter(Boolean);
  (async () => {
    for (const stmt of statements) {
      await db.$executeRawUnsafe(stmt).catch(() => {});
    }

    if (!process.env.VERCEL) {
      await db.$executeRawUnsafe(`PRAGMA journal_mode = WAL; PRAGMA mmap_size = 300000000; PRAGMA cache_size = -64000; PRAGMA synchronous = NORMAL;`).catch(() => {});
    }
  })();
}
