import path from "path";
import { fileURLToPath } from "url";

import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { requiredFeaturedLinks } from "@/workflows/blog-generation/utils/required-featured-links.util";
import { StateAnnotation } from "../blog-generation.state";

const toText = (content: unknown) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p: any) => (typeof p === "string" ? p : (p?.text ?? "")))
      .join("");
  }
  return String(content ?? "");
};

export async function reviseSection(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("reviseSection: _currentSectionId is null");

  const section = state._outline?.sections?.find(
    (s) => s.sectionId === sectionId,
  );
  if (!section)
    throw new Error(`reviseSection: section not found sectionId=${sectionId}`);

  const currentDraft = (state._sectionDrafts ?? {})[sectionId] ?? "";
  if (!currentDraft.trim()) {
    throw new Error(`reviseSection: missing draft for sectionId=${sectionId}`);
  }

  const critique = state._sectionCritique;
  if (!critique) {
    throw new Error(`reviseSection: missing critique`);
  }

  const prompt = await loadPromptHbs(
    "nodes/revise-section",
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

  const requiredLinks = requiredFeaturedLinks(section, state._context);
  const requiredKeywords = section.keywords ?? [];

  const payload = {
    context: state._context,
    section,
    sectionMarkdown: currentDraft,
    critique,
    invariants: {
      requiredLinks,
      requiredKeywords,
    },
  };

  const start = Date.now();
  const groq = new GroqClient();

  const text = await groq.chat({
    temperature: 0.15,
    topP: 0.9,
    reasoningEffort: "low",
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const revised = toText(text).trim();
  const durationMs = Date.now() - start;

  const prevIters = state._sectionRewriteIters ?? {};
  const nextIters = {
    ...prevIters,
    [sectionId]: (prevIters[sectionId] ?? 0) + 1,
  };

  console.debug("[reviseSection] revised", {
    blogId: state._blogId,
    sectionId,
    iteration: nextIters[sectionId],
    durationMs,
    preview: revised.slice(0, 200),
  });

  return {
    _sectionDrafts: {
      ...(state._sectionDrafts ?? {}),
      [sectionId]: revised,
    },
    _sectionRewriteIters: nextIters,
  };
}
