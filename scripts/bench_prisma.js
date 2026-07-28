const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log("Testing Prisma Query Speeds...");

  // 1. Seat number search
  let t0 = Date.now();
  const seatRes = await db.$queryRaw`SELECT id, name, seat_number as seatNumber, result, percentage FROM results WHERE seat_number = ${'2001970'} LIMIT 1`;
  console.log(`Prisma Raw Seat Search: ${Date.now() - t0} ms`, seatRes.length);

  // 2. Name search with Range Index Scan
  const term = "احمد";
  const upperBound = term.slice(0, -1) + String.fromCharCode(term.charCodeAt(term.length - 1) + 1);
  
  t0 = Date.now();
  const nameRes = await db.$queryRaw`SELECT id, name, seat_number as seatNumber, result, percentage FROM results WHERE normalized_name >= ${term} AND normalized_name < ${upperBound} LIMIT 20`;
  console.log(`Prisma Raw Name Range Search (${term} to ${upperBound}): ${Date.now() - t0} ms`, nameRes.length);

  await db.$disconnect();
}

main().catch(console.error);
