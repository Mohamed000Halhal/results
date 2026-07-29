const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('Database & Schema info:', dbInfo);

    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in public schema:', tables);

    const count = await prisma.studentResult.count();
    console.log('Total StudentResult count in DB:', count);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
