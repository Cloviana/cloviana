import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const DATABASE_URL = process.argv[2];
if (!DATABASE_URL) {
  console.error("Usage: tsx scripts/report-reddit-commentable.ts <DATABASE_URL>");
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
const THREADS_DIR = join(REPORTS_DIR, "threads");
const CUTOFF_DAYS = 7;
const CONCURRENCY = 10;

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

function isRedditUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "reddit.com" || hostname.endsWith(".reddit.com");
  } catch {
    return false;
  }
}

function extractPostId(url: string): string {
  const match = url.match(/\/comments\/([a-z0-9]+)/i);
  return match ? match[1] : url;
}

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.search = "";
    u.hash = "";
    // Ensure www prefix is stripped for consistency
    if (u.hostname === "www.reddit.com") u.hostname = "reddit.com";
    // Remove trailing slash
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

type CommentableStatus = "yes" | "no" | "error";

type RedditListing = { data?: { children?: Array<{ data?: { locked?: boolean; archived?: boolean } }> } };

type CheckResult = { status: CommentableStatus; rawJson: string | null };

async function checkCommentable(url: string): Promise<CheckResult> {
  const jsonUrl = url.replace(/\/?$/, "") + ".json?limit=1";
  try {
    const res = await fetch(jsonUrl, {
      headers: { "User-Agent": "cloviana-report-bot/1.0 (internal tooling)" },
    });

    if (res.status === 429) return { status: "error", rawJson: null };
    if (!res.ok) return { status: "error", rawJson: null };

    const rawJson = await res.text();
    const data = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(data) || data.length === 0) return { status: "yes", rawJson };

    const post = (data[0] as RedditListing)?.data?.children?.[0]?.data;
    if (!post) return { status: "yes", rawJson };

    const blocked = post.locked === true || post.archived === true;
    return { status: blocked ? "no" : "yes", rawJson };
  } catch {
    return { status: "error", rawJson: null };
  }
}

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CUTOFF_DAYS);

  const prompts = await prisma.prompt.findMany({
    where: { id: { in: PROMPT_IDS } },
    include: {
      responses: {
        where: { status: "SUCCESS", createdAt: { gte: cutoff } },
        include: { citations: true },
      },
    },
  });

  // Aggregate citation counts using normalized URLs
  const urlCount = new Map<string, number>();

  for (const prompt of prompts) {
    for (const r of prompt.responses) {
      for (const c of r.citations) {
        if (!isRedditUrl(c.url)) continue;
        const normalized = normalizeUrl(c.url);
        urlCount.set(normalized, (urlCount.get(normalized) ?? 0) + 1);
      }
    }
  }

  const sorted = [...urlCount.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`Found ${sorted.length} unique Reddit URLs. Checking commentability (${CONCURRENCY} concurrent)...`);

  type Row = { url: string; citations: number; commentable: CommentableStatus; rawJson: string | null };

  const rows: Row[] = new Array(sorted.length);
  for (let i = 0; i < sorted.length; i += CONCURRENCY) {
    const batch = sorted.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ([url, citations], j) => {
        const idx = i + j;
        const { status, rawJson } = await checkCommentable(url);
        console.log(`[${idx + 1}/${sorted.length}] ${status} — ${url}`);
        rows[idx] = { url, citations, commentable: status, rawJson };
      })
    );
    if (i + CONCURRENCY < sorted.length) await new Promise((r) => setTimeout(r, 2000));
  }

  const ts = Date.now();
  mkdirSync(THREADS_DIR, { recursive: true });

  // Save raw JSON for each commentable thread
  const commentable = rows.filter((r) => r.commentable === "yes");
  for (const { url, rawJson } of commentable) {
    if (!rawJson) continue;
    const postId = extractPostId(url);
    writeFileSync(join(THREADS_DIR, `${postId}.json`), rawJson, "utf8");
  }

  // Single CSV mapping key → url
  const csvLines = ["key,url,citations"];
  for (const { url, citations } of commentable) {
    csvLines.push(`${extractPostId(url)},${url},${citations}`);
  }
  mkdirSync(REPORTS_DIR, { recursive: true });
  const csvPath = join(REPORTS_DIR, `reddit-commentable-${ts}.csv`);
  writeFileSync(csvPath, csvLines.join("\n"), "utf8");
  console.log(`\nCSV: ${csvPath} — ${commentable.length} commentable threads`);
  console.log(`JSON files: ${THREADS_DIR}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
