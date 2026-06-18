const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const biz = "cmqfaiw9k0001ilps5ok459vn";

    // Check aggregate metrics (what overview uses)
    const aggMetrics = await prisma.businessMetric.findMany({
      where: { businessId: biz, competitorId: null, engine: null },
      orderBy: { date: "desc" },
      take: 5,
    });
    console.log("Aggregate metrics (competitorId=null, engine=null):");
    console.log(JSON.stringify(aggMetrics, null, 2));

    // Check engine metrics
    const engineMetrics = await prisma.businessMetric.findMany({
      where: { businessId: biz, competitorId: null, engine: { not: null } },
      take: 5,
    });
    console.log("\nEngine metrics (competitorId=null, engine!=null):");
    console.log(JSON.stringify(engineMetrics, null, 2));

    // Check all metric types
    const allMetrics = await prisma.businessMetric.findMany({
      where: { businessId: biz },
      select: {
        competitorId: true,
        engine: true,
        mentionRate: true,
        citationShare: true,
        sov: true,
      },
    });
    console.log("\nAll 30 metrics breakdown:");
    for (const m of allMetrics) {
      console.log(
        `  comp=${m.competitorId || "SELF"} engine=${m.engine || "ALL"} mention=${m.mentionRate} citation=${m.citationShare} sov=${m.sov}`,
      );
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
