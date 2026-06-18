import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!business) {
    console.log("No business found!");
    return;
  }

  const businessId = business.id;
  console.log(`Checking mentions of cloviana.com for business: ${business.name}`);

  const clovianaMentions = await prisma.mention.findMany({
    where: {
      domain: "cloviana.com",
    },
    include: {
      promptResponse: {
        include: {
          prompt: true,
        },
      },
    },
  });

  console.log(`\nFound ${clovianaMentions.length} mentions of cloviana.com.`);
  
  const engineCount = new Map<string, number>();
  const promptsMentioned = new Set<string>();

  for (const m of clovianaMentions) {
    const engine = m.promptResponse.engine;
    engineCount.set(engine, (engineCount.get(engine) || 0) + 1);
    promptsMentioned.add(m.promptResponse.prompt.text);
    console.log(`- Response ID: ${m.promptResponseId} | Engine: ${engine} | Prompt: ${m.promptResponse.prompt.text}`);
  }

  console.log("\n=== Breakdown by Engine ===");
  for (const [engine, count] of engineCount) {
    console.log(`- ${engine}: ${count}`);
  }

  console.log(`\nUnique prompts where cloviana.com was mentioned: ${promptsMentioned.size}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
