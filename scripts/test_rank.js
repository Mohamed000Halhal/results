const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRank(seatNumber) {
  const t0 = Date.now();
  const student = await prisma.studentResult.findFirst({
    where: { seatNumber },
  });

  if (!student) {
    console.log(`Student with seat ${seatNumber} not found.`);
    return;
  }

  // Calculate national rank: count students with higher percentage + 1
  const higherCount = await prisma.studentResult.count({
    where: {
      percentage: {
        gt: student.percentage,
      },
    },
  });

  const rank = higherCount + 1;
  const elapsed = Date.now() - t0;

  console.log(`Student: ${student.name}`);
  console.log(`Percentage: ${student.percentage}% | Marks: ${student.percentage * 4.1}`);
  console.log(`National Rank (ترتيبه على الجمهورية): #${rank.toLocaleString('ar-EG')} out of 910,000`);
  console.log(`Rank Calculation completed in: ${elapsed} ms!`);

  await prisma.$disconnect();
}

testRank("2901664");
