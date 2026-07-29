const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIndexSpeed() {
  const term = "ابراهيم سمير";
  const firstWord = "ابراهيم";

  // Fast B-tree index scan range
  const upperBound = firstWord.slice(0, -1) + String.fromCharCode(firstWord.charCodeAt(firstWord.length - 1) + 1);

  console.log("--- FAST INDEX RANGE QUERY ---");
  const t0 = Date.now();
  
  const results = await prisma.studentResult.findMany({
    where: {
      normalizedName: {
        gte: firstWord,
        lt: upperBound,
      },
      AND: [
        { normalizedName: { contains: "سمير" } }
      ]
    },
    take: 50
  });

  console.log(`Fast B-Tree Index Query: ${Date.now() - t0} ms (records=${results.length})`);
  await prisma.$disconnect();
}

testIndexSpeed();
