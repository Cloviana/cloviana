import "dotenv/config";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import type { AppConfiguration } from "@/config/app.configuration";
import { z } from "zod";

const REPORTS_DIR = join(import.meta.dirname, "reports");
const THREADS_DIR = join(REPORTS_DIR, "threads");
const PROMPTS_DIR = join(import.meta.dirname, "prompts");
const CONCURRENCY = 10;

const config = {
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
} as AppConfiguration;

const groq = new GroqService(config);
const anthropic = new AnthropicService(config);

type Style = "LISTICLE" | "SOFT_MENTION" | "NONE";

type RedditPost = { title: string; selftext: string; subreddit: string };
type RedditListing = { data: { children: Array<{ data: RedditPost }> } };
type RedditCommentListing = {
  data: { children: Array<{ data: { body?: string } }> };
};

function parseThread(
  raw: string,
): { post: RedditPost; topComments: string[] } | null {
  try {
    const data = JSON.parse(raw) as [RedditListing, RedditCommentListing];
    const post = data[0]?.data?.children?.[0]?.data;
    if (!post) return null;
    const topComments = (data[1]?.data?.children ?? [])
      .map((c) => c.data?.body ?? "")
      .filter((b) => b && b !== "[deleted]" && b !== "[removed]")
      .slice(0, 5)
      .map((b) => b.slice(0, 300));
    return { post, topComments };
  } catch {
    return null;
  }
}

function loadCsv(
  csvPath: string,
): Array<{ key: string; url: string; citations: number }> {
  return readFileSync(csvPath, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [key, url, citations] = line.split(",");
      return { key, url, citations: Number(citations) };
    });
}

function findLatestCsv(): string {
  const files = readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith("reddit-commentable-") && f.endsWith(".csv"))
    .sort()
    .reverse();
  if (files.length === 0)
    throw new Error("No reddit-commentable CSV found in reports/");
  return join(REPORTS_DIR, files[0]);
}

async function classifyThread(threadJson: string): Promise<Style> {
  const system = await loadPromptHbs(
    "reddit-comment-style",
    {},
    { baseDir: PROMPTS_DIR },
  );
  const result = await groq.parse({
    name: "reddit-style",
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: system },
      { role: "user", content: threadJson },
    ],
    schema: z.object({ style: z.enum(["LISTICLE", "SOFT_MENTION", "NONE"]) }),
  });
  return result.style as Style;
}

async function generateComment(
  style: Style,
  threadJson: string,
): Promise<string> {
  const promptName =
    style === "LISTICLE" ? "reddit-comment-listicle" : "reddit-comment-soft";
  const system = await loadPromptHbs(promptName, {}, { baseDir: PROMPTS_DIR });
  const result = await anthropic.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: style === "SOFT_MENTION" ? 250 : 500,
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: threadJson }],
  });
  return result.content.trim();
}

async function main() {
  const csvPath = process.argv[2] ?? findLatestCsv();
  console.log(`Using CSV: ${csvPath}`);

  const rows = loadCsv(csvPath);
  console.log(
    `Loaded ${rows.length} threads. Processing ${CONCURRENCY} at a time...`,
  );

  type OutputRow = {
    key: string;
    url: string;
    citations: number;
    style: Style;
    comment: string;
  };
  const output: OutputRow[] = new Array(rows.length);

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ key, url, citations }, j) => {
        const idx = i + j;
        let style: Style = "NONE";
        let comment = "";

        const jsonPath = join(THREADS_DIR, `${key}.json`);
        if (!existsSync(jsonPath)) {
          console.warn(
            `[${idx + 1}/${rows.length}] No JSON for ${key}, skipping`,
          );
          output[idx] = { key, url, citations, style, comment };
          return;
        }

        const parsed = parseThread(readFileSync(jsonPath, "utf8"));
        if (!parsed) {
          console.warn(
            `[${idx + 1}/${rows.length}] Could not parse ${key}, skipping`,
          );
          output[idx] = { key, url, citations, style, comment };
          return;
        }

        const threadJson = JSON.stringify({
          subreddit: parsed.post.subreddit,
          title: parsed.post.title,
          body: parsed.post.selftext?.slice(0, 500) || null,
          topComments: parsed.topComments,
        });

        try {
          style = await classifyThread(threadJson);
          if (style !== "NONE") {
            comment = await generateComment(style, threadJson);
          }
          console.log(`[${idx + 1}/${rows.length}] ${style} — ${key}`);
        } catch (err) {
          console.error(`[${idx + 1}/${rows.length}] Error for ${key}: ${err}`);
        }

        output[idx] = { key, url, citations, style, comment };
      }),
    );
  }

  const csvLines = ["key,url,citations,style,comment"];
  for (const { key, url, citations, style, comment } of output) {
    if (style === "NONE") continue;
    csvLines.push(
      `${key},${url},${citations},${style},"${comment.replace(/"/g, '""')}"`,
    );
  }

  const outPath = join(REPORTS_DIR, `reddit-comments-${Date.now()}.csv`);
  writeFileSync(outPath, csvLines.join("\n"), "utf8");
  console.log(`\nComments written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
