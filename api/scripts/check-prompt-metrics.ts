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
  console.log(`Checking prompt metrics for: ${business.name} (${businessId})`);

  // Query prompt metrics for self (competitorId is null)
  const ownPromptMetrics = await prisma.promptMetric.findMany({
    where: {
      competitorId: null,
      prompt: {
        businessId,
      },
    },
    include: {
      prompt: true,
    },
  });

  console.log(`\nFound ${ownPromptMetrics.length} own prompt metrics.`);
  const nonZero = ownPromptMetrics.filter((m) => m.mentionRate > 0);
  console.log(`Non-zero mention rate prompt metrics: ${nonZero.length}`);

  for (const m of ownPromptMetrics) {
    console.log(`- Prompt: ${m.prompt.text} | AwarenessStage: ${m.prompt.awarenessStage} | MentionRate: ${m.mentionRate}% | CitationShare: ${m.citationShare}% | SOV: ${m.sov}%`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
