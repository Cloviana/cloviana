import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.promptResponse.groupBy({
    by: ["engine", "status"],
    _count: {
      id: true,
    },
  });

  console.log("=== PromptResponse Counts by Engine and Status ===");
  for (const c of counts) {
    console.log(`- Engine: ${c.engine} | Status: ${c.status} | Count: ${c._count.id}`);
  }

  const latestRuns = await prisma.promptRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      prompt: true,
      responses: {
        select: {
          engine: true,
          status: true,
          error: true,
        }
      }
    }
  });

  console.log("\n=== Latest Prompt Runs ===");
  for (const run of latestRuns) {
    console.log(`- Run ID: ${run.id} | Prompt: "${run.prompt.text.slice(0, 40)}..." | Status: ${run.status}`);
    for (const resp of run.responses) {
      console.log(`  * Engine: ${resp.engine} | Status: ${resp.status} | Error: ${resp.error || 'None'}`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
