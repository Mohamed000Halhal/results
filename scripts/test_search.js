const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeArabic(text) {
  if (!text) return '';
  let normalized = text.toString();
  normalized = normalized.replace(/[\uFEFF\uFFFE\u200B-\u200D]/g, '');
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  normalized = normalized.replace(/[\u064B-\u0652\u0670]/g, '');
  normalized = normalized.replace(/\u0640/g, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized.toLowerCase();
}

async function testSearch(query) {
  const normalized = normalizeArabic(query);
  const tokens = normalized.split(' ').filter(Boolean);

  console.log('Query:', query, '| Normalized:', normalized, '| Tokens:', tokens);

  // Test 1: Using Prisma findMany (database agnostic)
  const whereClauses = tokens.map(token => ({
    normalizedName: {
      contains: token
    }
  }));

  const results = await prisma.studentResult.findMany({
    where: {
      AND: whereClauses
    },
    take: 10
  });

  console.log(`Prisma findMany found ${results.length} matches:`);
  results.forEach(r => console.log(`  - [${r.seatNumber}] ${r.name} (${r.percentage}%)`));

  await prisma.$disconnect();
}

testSearch('ابراهيم سمير ابراهيم');
