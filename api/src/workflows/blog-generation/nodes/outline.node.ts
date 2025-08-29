import { StateAnnotation } from "../blog-generation.state";
import { z } from "zod";
import { SectionSchema, ThumbnailSchema } from "../schemas/outline.schemas";
import path from "path";
import { loadPromptHbs } from "../utils/load-prompt-hbs.util";
import pRetry from "p-retry";
import { ChatOpenAI } from "@langchain/openai";
import { fileURLToPath } from "url";

const ResponseSchema = z.object({
  thumbnail: ThumbnailSchema,
  sections: z.array(SectionSchema).min(1),
  description: z.string().describe("A meta description is a short summary (usually 150–160 characters) placed in a webpage’s HTML that tells search engines and users what the page is about.")
});

function extractText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (Array.isArray(node.children))
    return node.children.map(extractText).join(" ");
  return "";
}

export async function outline(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[outline] start");
  console.debug("[outline] metadata keys:", Object.keys(state._metadata ?? {}));
  console.debug(
    "[outline] incoming headings:",
    Array.isArray(state._headings) ? state._headings.length : 0,
  );

  const llm = new ChatOpenAI({
    model: "gpt-4.1-mini-2025-04-14",
  }).withStructuredOutput(ResponseSchema, { strict: true });

  const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
  console.debug("[outline] prompts baseDir:", baseDir);

  const mainPrompt = await loadPromptHbs(
    "outline.prompt",
    {
      minWords: state._metadata.blogLength.min,
      maxWords: state._metadata.blogLength.max,
    },
    {
      baseDir,
    },
  );

  console.debug("[outline] prompt length:", mainPrompt?.length ?? 0);

  const payload = {
    metadata: state._metadata,
  };

  const payloadStr = JSON.stringify(payload);
  console.debug(
    "[outline] payload size (bytes):",
    Buffer.byteLength(payloadStr, "utf8"),
  );

  const t0 = Date.now();

  const { thumbnail, sections, description } = await pRetry(
    async () => {
      console.info("[outline] invoking LLM");
      const invokeStart = Date.now();
      const res = await llm.invoke([
        { type: "system", content: mainPrompt },
        { type: "human", content: JSON.stringify(payload, null, 2) },
      ]);
      console.info(
        "[outline] LLM invocation done in",
        Date.now() - invokeStart,
        "ms",
      );
      return res;
    },
    {
      retries: 3,
      minTimeout: 3000,
      maxTimeout: 5000,
      onFailedAttempt: (context) => {
        console.warn(
          `[outline] retry ${context.attemptNumber} failed; retries left: ${context.retriesLeft}; error:`,
          context.message,
        );
      },
    },
  );

  console.info("[outline] total latency:", Date.now() - t0, "ms");

  if (!sections?.length) {
    console.error("[outline] no sections returned");
    throw new Error(
      "Model returned no sections; revise outline.prompt to require a non-empty sections array.",
    );
  }

  console.debug("[outline] sections count:", sections.length);

  console.debug(
    "[outline] thumbnail prompt length:",
    thumbnail?.prompt?.length ?? 0,
  );

  const result = {
    _outline: {
      thumbnail,
      sections,
      description
    },
  };

  console.info("[outline] success");
  return result;
}
