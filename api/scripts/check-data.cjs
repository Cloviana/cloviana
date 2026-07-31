const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true, domain: true, status: true },
    });
    console.log("Businesses:", JSON.stringify(businesses, null, 2));

    if (businesses.length > 0) {
      const biz = businesses[0];
      const prompts = await prisma.prompt.findMany({
        where: { businessId: biz.id, status: "ACTIVE" },
        select: { id: true, text: true },
      });
      console.log(`\nPrompts for ${biz.name} (${biz.id}):`, prompts.length);
      for (const prompt of prompts) {
        console.log(`  - ${prompt.id}: ${prompt.text.substring(0, 80)}`);
      }

      const runs = await prisma.promptRun.count({
        where: { prompt: { businessId: biz.id } },
      });
      const responses = await prisma.promptResponse.count({
        where: { prompt: { businessId: biz.id } },
      });
      const mentions = await prisma.mention.count({
        where: { promptResponse: { prompt: { businessId: biz.id } } },
      });
      const citations = await prisma.citation.count({
        where: { promptResponse: { prompt: { businessId: biz.id } } },
      });
      const metrics = await prisma.businessMetric.count({
        where: { businessId: biz.id },
      });
      console.log(`\nData counts for ${biz.name}:`);
      console.log(`  Runs: ${runs}`);
      console.log(`  Responses: ${responses}`);
      console.log(`  Mentions: ${mentions}`);
      console.log(`  Citations: ${citations}`);
      console.log(`  Business Metrics: ${metrics}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
