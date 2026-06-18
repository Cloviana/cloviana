import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      competitors: true,
    },
  });

  if (!business) {
    console.log("No business found!");
    return;
  }

  console.log("=== Active Business ===");
  console.log(`ID: ${business.id}`);
  console.log(`Name: ${business.name}`);
  console.log(`Domain: ${business.domain}`);
  console.log(`Status: ${business.status}`);
  console.log(`Setup Status: ${business.setupStatus}`);
  console.log(`Setup Step: ${business.setupStep}`);

  const jobs = await prisma.job.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("\n=== Latest Jobs ===");
  if (jobs.length === 0) {
    console.log("No jobs found for this business.");
  } else {
    for (const job of jobs) {
      console.log(`- ID: ${job.id}`);
      console.log(`  Type: ${job.type}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Error: ${job.error}`);
      console.log(`  Progress: ${JSON.stringify(job.progress)}`);
      console.log(`  CreatedAt: ${job.createdAt.toISOString()}`);
      console.log(`  FinishedAt: ${job.finishedAt ? job.finishedAt.toISOString() : "null"}`);
    }
  }

  const promptCount = await prisma.prompt.count({
    where: { businessId: business.id },
  });
  console.log(`\nPrompts count: ${promptCount}`);

  const runCount = await prisma.promptRun.count({
    where: { prompt: { businessId: business.id } },
  });
  console.log(`PromptRun count: ${runCount}`);

  const responseCount = await prisma.promptResponse.count({
    where: { promptRun: { prompt: { businessId: business.id } } },
  });
  console.log(`PromptResponse count: ${responseCount}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
