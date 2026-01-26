import path from "path";
import { fileURLToPath } from "url";

import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import { StateAnnotation } from "../blog-generation.state";
import { ReviewSectionSchema } from "../schemas/review-section.schema";

const normalize = (s: string) =>
  s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

const countOccurrences = (text: string, phrase: string) => {
  const t = normalize(text);
  const p = normalize(phrase);
  if (!p) return 0;
  let c = 0;
  let i = 0;
  for (;;) {
    const hit = t.indexOf(p, i);
    if (hit === -1) break;
    c++;
    i = hit + p.length;
  }
  return c;
};

export async function reviewSection(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("reviewSection: _currentSectionId is null");

  const section = state._outline?.sections?.find(
    (s) => s.sectionId === sectionId,
  );
  if (!section)
    throw new Error(`reviewSection: section not found sectionId=${sectionId}`);

  const role = section.role;

  const sectionMarkdown = (state._sectionDrafts?.[sectionId] ?? "").trim();

  const prompt = await loadPromptHbs(
    "nodes/review-section",
    {
      metadata: {
        contentType: state._context.core.contentType,
        section: { role: section.role },
      },
      section,
    },
    {
      baseDir,
      partialsDir: baseDir,
      helpers: { concat: (...args: any[]) => args.slice(0, -1).join("") },
    },
  );

  const keywords = section.keywords ?? [];
  const keywordCounts = Object.fromEntries(
    keywords.map((k) => [k, countOccurrences(sectionMarkdown, k)]),
  );
  const missingKeywords = Object.entries(keywordCounts)
    .filter(([, c]) => c === 0)
    .map(([k]) => k);

  const payload = {
    context: state._context,
    strategy: state._strategy,
    section,
    sectionMarkdown,
    keywordCounts,
    missingKeywords,
  };

  const start = Date.now();

  const groq = new GroqClient();

  const critique = await groq.chatJson<z.infer<typeof ReviewSectionSchema>>({
    name: "review",
    schema: ReviewSectionSchema,
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    retries: 7,
    reasoningEffort: "low",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const durationMs = Date.now() - start;

  console.debug("[reviewSection] critique generated", {
    blogId: state._blogId,
    sectionId,
    role,
    durationMs,
    preview: {
      pass: critique.pass,
      issueCount: critique.issues?.length ?? 0,
    },
  });

  return { _sectionCritique: critique };
}
