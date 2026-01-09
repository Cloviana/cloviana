import pRetry from "p-retry";
import path from "path";
import { fileURLToPath } from "url";
import { HumanMessage, SystemMessage } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { StateAnnotation } from "../blog-generation.state";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import { REVISE_PROMPT_MAP } from "@/workflows/blog-generation/constants/revise-prompt";

const toText = (content: unknown) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
      .join("");
  }
  return String(content ?? "");
};

export async function reviseSection(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts"
  );
  const partialsDir = path.join(baseDir, "partials");

  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("reviseSection: _currentSectionId is null");

  const section =
    state._outline?.sections?.find((s) => s.sectionId === sectionId) ?? null;
  if (!section) throw new Error(`reviseSection: section not found sectionId=${sectionId}`);

  const currentDraft = (state._sectionDrafts ?? {})[sectionId] ?? "";
  if (!currentDraft.trim()) throw new Error(`reviseSection: missing draft for sectionId=${sectionId}`);

  const critique = state._sectionCritique;
  if (!critique || critique.sectionId !== sectionId) {
    throw new Error(`reviseSection: missing or mismatched critique for sectionId=${sectionId}`);
  }

  const role = section.role as keyof typeof REVISE_PROMPT_MAP;
        
    const prompt = await loadPromptHbs(REVISE_PROMPT_MAP[role], {}, { baseDir, partialsDir });
  

  const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
  });

  const msg = await pRetry(
    async () => {
      return await llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage(
          JSON.stringify({
            context: state._context,
            strategy: state._strategy,
            section,
            sectionMarkdown: currentDraft,
            critique,
            draftSoFar: {
              sectionIdsInOrder: state._sectionOrder ?? [],
              sectionDrafts: state._sectionDrafts ?? {},
            },
          })
        ),
      ]);
    },
    { retries: 2, minTimeout: 8000, maxTimeout: 60000 }
  );

  const revised = toText(msg.content).trim();

  const prevIters = state._sectionRewriteIters ?? {};
  const nextIters = {
    ...prevIters,
    [sectionId]: (prevIters[sectionId] ?? 0) + 1,
  };

  console.log(revised)

  return {
    _sectionDrafts: {
      ...(state._sectionDrafts ?? {}),
      [sectionId]: revised,
    },
    _sectionRewriteIters: nextIters,
  };
}
