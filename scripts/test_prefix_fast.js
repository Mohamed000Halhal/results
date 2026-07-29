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

function getRangeUpperBound(term) {
  if (!term) return '';
  const lastChar = term.slice(-1);
  const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
  return term.slice(0, -1) + nextChar;
}

async function testFastIndex(query) {
  const normalized = normalizeArabic(query);
  const upperBound = getRangeUpperBound(normalized);

  console.log(`Searching range: >= "${normalized}" AND < "${upperBound}"`);
  const t0 = Date.now();

  const results = await prisma.studentResult.findMany({
    where: {
      normalizedName: {
        gte: normalized,
        lt: upperBound,
      }
    },
    take: 50,
    select: { id: true, name: true, seatNumber: true, result: true, percentage: true }
  });

  console.log(`Fast B-Tree Index Search completed in: ${Date.now() - t0} ms! Found: ${results.length} students`);
  results.slice(0, 5).forEach((s, i) => console.log(`  ${i+1}. [${s.seatNumber}] ${s.name}`));

  await prisma.$disconnect();
}

testFastIndex("ابراهيم سمير");
