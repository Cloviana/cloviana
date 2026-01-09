import pRetry from "p-retry";
import path from "path";
import { fileURLToPath } from "url";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateAnnotation } from "../blog-generation.state";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import { ChatAnthropic } from "@langchain/anthropic";

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
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts"
  );
  const partialsDir = path.join(baseDir, "partials");

  const prompt = await loadPromptHbs("assemble", {}, { baseDir, partialsDir });

  const stitched = stitchSectionsInOrder(state);
  if (!stitched.trim()) throw new Error("assemble: no section drafts found");

  const llm = new ChatAnthropic({
    model: "claude-4-sonnet-20250514",
    temperature: 0.2,
  });

  const assembled = await pRetry(
    async () => {
      const res = await llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage(
          JSON.stringify({
            context: state._context,
            draft: stitched,
          })
        ),
      ]);

      const text = typeof res.content === "string" ? res.content : String(res.content ?? "");
      if (!text.trim()) throw new Error("assemble: empty model output");
      return text;
    },
    { retries: 2, minTimeout: 8000, maxTimeout: 60000, factor: 2 }
  );

  const cleaned = normalizeDashes(assembled);

  console.log(cleaned)

  return {
    _draft: cleaned,
  };
}
