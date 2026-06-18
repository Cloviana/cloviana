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
  console.log(`Checking recent chats for business: ${business.name} (${businessId})`);

  const activePrompts = await prisma.prompt.findMany({
    where: { businessId, status: "ACTIVE" },
    select: { id: true, text: true },
  });

  const promptMap = new Map(activePrompts.map((p) => [p.id, p.text]));
  const promptIds = Array.from(promptMap.keys());

  const recentResponses = await prisma.promptResponse.findMany({
    where: {
      promptId: { in: promptIds },
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      citations: true,
      mentions: true,
    },
  });

  console.log(`Found ${recentResponses.length} recent responses.`);
  for (const r of recentResponses) {
    console.log(`- ID: ${r.id} | Engine: ${r.engine} | Citations: ${r.citations.length} | Mentions: ${r.mentions.length} | CreatedAt: ${r.createdAt.toISOString()}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
