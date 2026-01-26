import path from "path";
import { fileURLToPath } from "url";

import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { JobsService } from "@/modules/jobs/jobs.service";
import { computePercent } from "@/workflows/blog-generation/utils/compute-percent.util";
import { requiredFeaturedLinks } from "@/workflows/blog-generation/utils/required-featured-links.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../blog-generation.state";

export async function writeSection(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const jobs = configurable?.jobs as JobsService | undefined;
  const jobId = configurable?.jobId as string | undefined;
  if (!jobs) throw new Error("jobs service not provided");
  if (!jobId) throw new Error("jobId not provided");

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("writeSection: _currentSectionId is null");

  const section = state._outline?.sections?.find(
    (s) => s.sectionId === sectionId,
  );
  if (!section)
    throw new Error(`writeSection: section not found sectionId=${sectionId}`);

  const totalSections = state._sectionOrder?.length ?? 0;
  const completedSections = Object.values(state._sectionDrafts ?? {}).filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  ).length;

  const percent = computePercent({
    phase: "writing",
    prevPercent: state._progressPercent ?? 0,
    totalSections,
    completedSections,
  });

  await jobs.setRuntime(jobId, {
    title: "Writing sections",
    percent,
  });

  const prompt = await loadPromptHbs(
    "nodes/write-section",
    {
      metadata: {
        contentType: state._context.core.contentType,
        section: { role: section.role },
      },
    },
    {
      baseDir,
      partialsDir: baseDir,
      helpers: { concat: (...args: any[]) => args.slice(0, -1).join("") },
    },
  );

  const requiredLinks = requiredFeaturedLinks(section, state._context);
  const requiredKeywords = section.keywords ?? [];

  const payload = {
    context: state._context,
    strategy: state._strategy,
    section,
    draftSoFar: {
      sections: state._sectionDrafts ?? {},
    },
    invariants: {
      requiredLinks,
      requiredKeywords,
    },
  };

  const start = Date.now();

  const groq = new GroqClient();

  const text = await groq.chat({
    model: "openai/gpt-oss-120b",
    temperature: 0.28,
    topP: 0.92,
    reasoningEffort: "low",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const markdown = text.trim();

  const durationMs = Date.now() - start;

  console.debug("[writeSection] drafted", {
    blogId: state._blogId,
    sectionId,
    role: section.role,
    durationMs,
    preview: markdown.slice(0, 200),
  });

  return {
    _sectionDrafts: {
      ...(state._sectionDrafts ?? {}),
      [sectionId]: markdown,
    },
  };
}
