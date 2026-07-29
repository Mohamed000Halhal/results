const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTrgmIndex() {
  console.log('--- ENABLING PG_TRGM EXTENSION AND CREATING GIN TRIGRAM INDEX ---');
  const t0 = Date.now();

  try {
    // 1. Enable pg_trgm extension
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log('✅ Extension pg_trgm enabled.');

    // 2. Create GIN index on normalized_name for sub-10ms substring matching
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS results_normalized_name_trgm_idx ON results USING gin (normalized_name gin_trgm_ops);`
    );
    console.log('✅ GIN Trigram index created on normalized_name.');

    // 3. Create B-Tree index on percentage if not exists
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS results_percentage_idx ON results (percentage DESC);`
    );
    console.log('✅ B-Tree index created on percentage.');

    console.log(`🎉 Performance Indexes Applied Successfully in ${Date.now() - t0} ms!`);
  } catch (err) {
    console.error('Index creation error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

addTrgmIndex();
