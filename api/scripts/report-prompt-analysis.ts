import { PrismaClient, AiEngine } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATABASE_URL = process.argv[2];
if (!DATABASE_URL) {
  console.error("Usage: tsx scripts/report-prompt-analysis.ts <DATABASE_URL>");
  process.exit(1);
}

const PROMPT_IDS = [
  "02fb2fc1-a0f9-43b8-8f65-29ab6b510016",
  "a0a202c9-c8e5-4f13-9727-5ca41bfaccea",
  "c3cf7200-7cc7-45cc-9a41-8a15e8c77a39",
  "7174dd61-53f3-40f1-931b-c65444977517",
  "e0928a77-5b26-4c7d-89c8-fcb744906737",
  "59a37236-08b7-4ff2-9754-ed7681fe7ea1",
  "216cd3d1-4b57-476d-8c18-807d1e19112b",
  "8c89119e-2a7d-4702-8979-70e91dbf349f",
];

const REPORTS_DIR = join(import.meta.dirname, "reports");
const CUTOFF_DAYS = 7;

const ENGINE_LABEL: Record<AiEngine, string> = {
  CHATGPT: "ChatGPT",
  CLAUDE: "Claude",
  PERPLEXITY: "Perplexity",
  AI_OVERVIEWS: "AI Overviews",
};

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

function topN<T>(map: Map<T, number>, n: number): [T, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CUTOFF_DAYS);

  const prompts = await prisma.prompt.findMany({
    where: { id: { in: PROMPT_IDS } },
    include: {
      responses: {
        where: {
          status: "SUCCESS",
          createdAt: { gte: cutoff },
        },
        include: {
          mentions: true,
          citations: true,
          fanOutQueries: true,
        },
      },
    },
    orderBy: { awarenessStage: "asc" },
  });

  const lines: string[] = [];
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  lines.push(`# Prompt Analysis Report`);
  lines.push(`> Last ${CUTOFF_DAYS} days · Generated ${generatedAt}`);
  lines.push("");

  for (const prompt of prompts) {
    const responses = prompt.responses;
    const runCount = new Set(responses.map((r) => r.promptRunId)).size;
    const engines = [...new Set(responses.map((r) => r.engine))]
      .map((e) => ENGINE_LABEL[e])
      .join(" + ");

    lines.push("---");
    lines.push("");
    lines.push(`## ${prompt.text}`);
    lines.push("");
    lines.push(`**Runs included:** Last ${CUTOFF_DAYS} days / ${runCount} runs / ${engines || "none"}`);
    lines.push("");

    if (responses.length === 0) {
      lines.push("_No data in this period._");
      lines.push("");
      continue;
    }

    // Mentioned brands
    const brandCount = new Map<string, number>();
    for (const r of responses) {
      for (const m of r.mentions) {
        brandCount.set(m.name, (brandCount.get(m.name) ?? 0) + 1);
      }
    }
    const topBrands = topN(brandCount, 10);

    lines.push("**Mentioned brands:**");
    lines.push("");
    if (topBrands.length > 0) {
      for (const [name, count] of topBrands) {
        lines.push(`- ${name}: ${count}`);
      }
    } else {
      lines.push("_None_");
    }
    lines.push("");

    // Top cited URLs
    const urlCount = new Map<string, number>();
    for (const r of responses) {
      for (const c of r.citations) {
        urlCount.set(c.url, (urlCount.get(c.url) ?? 0) + 1);
      }
    }
    const topUrls = topN(urlCount, 10);

    lines.push("**Top cited URLs:**");
    lines.push("");
    if (topUrls.length > 0) {
      for (const [i, [url, count]] of topUrls.entries()) {
        lines.push(`${i + 1}. ${url} — ${count} citation${count === 1 ? "" : "s"}`);
      }
    } else {
      lines.push("_None_");
    }
    lines.push("");

    // Fan-out queries — ranked by frequency across runs (filter one-offs)
    const fanOutCount = new Map<string, number>();
    for (const r of responses) {
      for (const fq of r.fanOutQueries) {
        const key = fq.query.trim().toLowerCase();
        fanOutCount.set(key, (fanOutCount.get(key) ?? 0) + 1);
      }
    }
    // Keep only queries that appear more than once, then take top 10
    const repeatedFanOuts = [...fanOutCount.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Fall back to top 10 by frequency if nothing repeats
    const fanOuts = repeatedFanOuts.length > 0 ? repeatedFanOuts : topN(fanOutCount, 10);

    lines.push("**Fan-out queries:**");
    lines.push("");
    if (fanOuts.length > 0) {
      for (const [query, count] of fanOuts) {
        lines.push(`- ${query} (${count})`);
      }
    } else {
      lines.push("_None_");
    }
    lines.push("");
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const filename = `prompt-analysis-${Date.now()}.md`;
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
