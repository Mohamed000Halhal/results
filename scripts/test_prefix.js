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

async function testPrefixSearch(query) {
  const normalized = normalizeArabic(query);
  const tokens = normalized.split(' ').filter(Boolean);
  const firstWord = tokens[0] || '';

  console.log(`Searching for: "${query}" (Normalized: "${normalized}")`);
  const t0 = Date.now();

  // Tier 1: Starts with full query (Index scan - super fast)
  const tier1 = await prisma.studentResult.findMany({
    where: {
      normalizedName: { startsWith: normalized }
    },
    take: 30,
    select: { id: true, name: true, seatNumber: true, result: true, percentage: true }
  });

  console.log(`Tier 1 (Prefix Match): ${Date.now() - t0} ms, Count: ${tier1.length}`);

  // Tier 2: Starts with first word & contains other words
  let tier2 = [];
  if (tier1.length < 30 && tokens.length > 1) {
    const t1 = Date.now();
    const otherTokens = tokens.slice(1);
    tier2 = await prisma.studentResult.findMany({
      where: {
        normalizedName: { startsWith: firstWord },
        AND: otherTokens.map(t => ({ normalizedName: { contains: t } })),
        NOT: { id: { in: tier1.map(t => t.id) } }
      },
      take: 30 - tier1.length,
      select: { id: true, name: true, seatNumber: true, result: true, percentage: true }
    });
    console.log(`Tier 2 (First Name + Tokens): ${Date.now() - t1} ms, Count: ${tier2.length}`);
  }

  const combined = [...tier1, ...tier2];
  console.log(`Total Results (${Date.now() - t0} ms total):`);
  combined.forEach((s, idx) => console.log(`  ${idx + 1}. [${s.seatNumber}] ${s.name} (${s.percentage}%)`));

  await prisma.$disconnect();
}

testPrefixSearch("ابراهيم سمير");
