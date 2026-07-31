import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AiEngine, PrismaClient, PromptStatus } from "@prisma/client";

const DATABASE_URL = process.argv[2];
if (!DATABASE_URL) {
  console.error("Usage: tsx scripts/report-citations.ts <DATABASE_URL>");
  process.exit(1);
}

const BUSINESS_ID = "cmovqk3jw000104l8g6jp2mil";
const REPORTS_DIR = join(import.meta.dirname, "reports");

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

function bar(count: number, max: number, width = 28): string {
  const filled = Math.round((count / max) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

async function main() {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: BUSINESS_ID },
    include: {
      prompts: {
        where: { status: PromptStatus.ACTIVE },
        orderBy: { awarenessStage: "asc" },
        include: {
          responses: {
            where: { status: "SUCCESS" },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            include: {
              citations: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });

  const lines: string[] = [];
  const generatedAt = `${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`;

  lines.push(`# Citation Report — ${business.name}`);
  lines.push(`> ${business.domain} · Generated ${generatedAt}`);
  lines.push("");

  for (const prompt of business.prompts) {
    lines.push(`## ${prompt.text}`);
    lines.push(`_${prompt.awarenessStage}_`);
    lines.push("");

    const latestByEngine = new Map<AiEngine, (typeof prompt.responses)[0]>();
    for (const response of prompt.responses) {
      if (!latestByEngine.has(response.engine)) {
        latestByEngine.set(response.engine, response);
      }
    }

    if (latestByEngine.size === 0) {
      lines.push("_No responses recorded yet._");
      lines.push("");
      continue;
    }

    const allCitations = [...latestByEngine.values()].flatMap(
      (r) => r.citations,
    );
    if (allCitations.length === 0) {
      lines.push("_No citations._");
      lines.push("");
      continue;
    }

    const crossCount = new Map<string, number>();
    for (const c of allCitations) {
      crossCount.set(c.domain, (crossCount.get(c.domain) ?? 0) + 1);
    }
    const crossSorted = [...crossCount.entries()].sort((a, b) => b[1] - a[1]);
    const crossMax = crossSorted[0][1];

    lines.push("```");
    for (const [domain, count] of crossSorted) {
      lines.push(
        `${bar(count, crossMax)} ${String(count).padStart(2)}  ${domain}`,
      );
    }
    lines.push("```");
    lines.push("");
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const filename = `citation-report-${Date.now()}.md`;
  const outputPath = join(REPORTS_DIR, filename);
  writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`Report written to ${outputPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
