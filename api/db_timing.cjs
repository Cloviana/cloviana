const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const t0 = Date.now();
  await p.$queryRaw`SELECT 1`;
  console.log('first query (conn+query):', Date.now() - t0, 'ms');
  const t1 = Date.now();
  await p.$queryRaw`SELECT 1`;
  console.log('second query (warm conn):', Date.now() - t1, 'ms');
  const t2 = Date.now();
  await p.chat.findFirst({ where: { businessId: 'nonexistent' } });
  console.log('findFirst query:', Date.now() - t2, 'ms');
  await p.$disconnect();
})();
