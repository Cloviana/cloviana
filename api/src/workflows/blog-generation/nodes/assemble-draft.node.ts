import path from "path";
import { fileURLToPath } from "url";
import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { JobsService } from "@/modules/jobs/jobs.service";
import { computePercent } from "@/workflows/blog-generation/utils/compute-percent.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../blog-generation.state";

function normalizeDashes(input: string): string {
  return input.replace(/\u2014/g, ", ");
}

function stitchSectionsInOrder(state: typeof StateAnnotation.State): string {
  const drafts = state._sectionDrafts ?? {};
  const outlineSections = state._outline?.sections ?? [];
  const order =
    (state._sectionOrder && state._sectionOrder.length > 0
      ? state._sectionOrder
      : outlineSections.map((s) => s.sectionId)) ?? [];

  return order
    .map((id) => (drafts[id] ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

export async function assembleDraft(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const jobs = configurable?.jobs as JobsService | undefined;
  const jobId = configurable?.jobId as string | undefined;
  if (!jobs) throw new Error("jobs service not provided");
  if (!jobId) throw new Error("jobId not provided");

  const percent = computePercent({
    phase: "assemble",
    prevPercent: state._progressPercent ?? 0,
  });

  await jobs.setRuntime(jobId, {
    title: "Assembling sections",
    percent,
  });

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("nodes/assemble", {}, { baseDir });

  const stitched = stitchSectionsInOrder(state);
  if (!stitched.trim()) throw new Error("assemble: no section drafts found");

  const start = Date.now();

  const groq = new GroqClient();

  const text = await groq.chat({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    reasoningEffort: "low",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          context: state._context,
          draft: stitched,
        }),
      },
    ],
  });

  const cleaned = normalizeDashes(text);

  const durationMs = Date.now() - start;

  console.debug("[assemble] draft assembled", {
    blogId: state._blogId,
    durationMs,
    length: cleaned.length,
    preview: cleaned.slice(0, 300),
  });

  return {
    _draft: cleaned,
  };
}
