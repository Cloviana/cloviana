import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        prompts: true,
      },
    });

    console.log(`Found ${businesses.length} businesses:`);
    for (const b of businesses) {
      console.log(`- ID: ${b.id}`);
      console.log(`  Name: ${b.name}`);
      console.log(`  Domain: ${b.domain}`);
      console.log(`  Profile URL: ${b.profileUrl}`);
      console.log(`  Setup Status: ${b.setupStatus}`);
      console.log(`  Setup Step: ${b.setupStep}`);
      console.log(`  Prompts count: ${b.prompts.length}`);

      // Query jobs for this business
      const jobs = await prisma.job.findMany({
        where: { businessId: b.id },
        orderBy: { createdAt: "desc" },
      });
      console.log(`  Jobs count: ${jobs.length}`);
      for (const j of jobs) {
        console.log(`    * Job ID: ${j.id}`);
        console.log(`      Type: ${j.type}`);
        console.log(`      Status: ${j.status}`);
        console.log(`      Error: ${j.error}`);
        console.log(`      Created At: ${j.createdAt}`);
        if (j.status === "SUCCESS" && j.result) {
          try {
            const res =
              typeof j.result === "string" ? JSON.parse(j.result) : j.result;
            const universe = res.promptUniverse;
            if (universe) {
              console.log(`      Universe status: ready`);
              console.log(
                `      Clusters count: ${universe.clusters?.length ?? 0}`,
              );
              for (const c of universe.clusters ?? []) {
                console.log(`        - Cluster Name: ${c.name} (${c.id})`);
                console.log(`          Description: ${c.description}`);
              }
              console.log(
                `      Prompts in universe: ${universe.prompts?.length ?? 0}`,
              );
            }
          } catch (e) {
            console.log(`      Error parsing result JSON: ${e.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error querying DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
