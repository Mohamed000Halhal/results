const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSpeed() {
  const query = "ابراهيم سمير";
  const tokens = ["ابراهيم", "سمير"];

  const conditions = tokens.map(token => ({
    normalizedName: { contains: token }
  }));

  console.log("--- TEST 1: WITH COUNT() ---");
  let t0 = Date.now();
  const count = await prisma.studentResult.count({ where: { AND: conditions } });
  const results1 = await prisma.studentResult.findMany({ where: { AND: conditions }, take: 50 });
  console.log(`With COUNT(): ${Date.now() - t0} ms (count=${count}, records=${results1.length})`);

  console.log("--- TEST 2: WITHOUT COUNT() ---");
  t0 = Date.now();
  const results2 = await prisma.studentResult.findMany({ where: { AND: conditions }, take: 50 });
  console.log(`Without COUNT(): ${Date.now() - t0} ms (records=${results2.length})`);

  await prisma.$disconnect();
}

testSpeed();
