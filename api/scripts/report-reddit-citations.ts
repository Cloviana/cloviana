import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const DATABASE_URL = process.argv[2];
if (!DATABASE_URL) {
  console.error("Usage: tsx scripts/report-reddit-citations.ts <DATABASE_URL>");
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

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

function isRedditUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "reddit.com" || hostname.endsWith(".reddit.com");
  } catch {
    return false;
  }
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
          citations: true,
        },
      },
    },
    orderBy: { awarenessStage: "asc" },
  });

  const lines: string[] = [];
  const generatedAt = `${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`;

  lines.push("# Reddit Citations Report");
  lines.push(`> Last ${CUTOFF_DAYS} days · Generated ${generatedAt}`);
  lines.push("");

  // Global aggregation across all prompts
  const globalUrlCount = new Map<string, number>();

  for (const prompt of prompts) {
    const responses = prompt.responses;

    const urlCount = new Map<string, number>();
    for (const r of responses) {
      for (const c of r.citations) {
        if (!isRedditUrl(c.url)) {
          continue;
        }
        urlCount.set(c.url, (urlCount.get(c.url) ?? 0) + 1);
        globalUrlCount.set(c.url, (globalUrlCount.get(c.url) ?? 0) + 1);
      }
    }

    const sorted = [...urlCount.entries()].sort((a, b) => b[1] - a[1]);

    lines.push("---");
    lines.push("");
    lines.push(`## ${prompt.text}`);
    lines.push("");

    if (sorted.length === 0) {
      lines.push("_No Reddit citations in this period._");
      lines.push("");
      continue;
    }

    lines.push(
      `**${sorted.length} unique Reddit URL${sorted.length === 1 ? "" : "s"}**`,
    );
    lines.push("");
    for (const [i, [url, count]] of sorted.entries()) {
      lines.push(
        `${i + 1}. ${url} — ${count} citation${count === 1 ? "" : "s"}`,
      );
    }
    lines.push("");
  }

  // Global summary
  const globalSorted = [...globalUrlCount.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  lines.push("---");
  lines.push("");
  lines.push("## All Prompts — Reddit URLs by Citation Count");
  lines.push("");

  if (globalSorted.length === 0) {
    lines.push("_No Reddit citations found._");
    lines.push("");
  } else {
    lines.push(
      `**${globalSorted.length} unique Reddit URL${globalSorted.length === 1 ? "" : "s"} across all prompts**`,
    );
    lines.push("");
    for (const [i, [url, count]] of globalSorted.entries()) {
      lines.push(
        `${i + 1}. ${url} — ${count} citation${count === 1 ? "" : "s"}`,
      );
    }
    lines.push("");
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const filename = `reddit-citations-${Date.now()}.md`;
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
