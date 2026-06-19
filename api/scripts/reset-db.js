const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.profile.deleteMany({});
  await prisma.business.deleteMany({});
  console.log('All profiles and businesses deleted for testing.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
