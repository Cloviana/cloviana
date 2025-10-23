import { StateAnnotation } from "../blog-generation.state";
import { z } from "zod";
import { OutlineSchema, ThumbnailSchema } from "../schemas/outline.schemas";
import path from "path";
import { loadPromptHbs } from "../utils/load-prompt-hbs.util";
import pRetry from "p-retry";
import { ChatOpenAI } from "@langchain/openai";
import { fileURLToPath } from "url";

const ResponseSchema = z.object({
  thumbnail: ThumbnailSchema,
  outline: OutlineSchema,
  description: z.string().describe("A meta description is a short summary (usually 150–160 characters) placed in a webpage’s HTML that tells search engines and users what the page is about.")
});

export async function outline(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[outline] start");
  console.debug("[outline] metadata keys:", Object.keys(state._metadata ?? {}));

  const llm = new ChatOpenAI({
    model: "gpt-5-mini",
    reasoning: { effort: "medium" }
  }).withStructuredOutput(ResponseSchema, { strict: true });

  const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
  console.debug("[outline] prompts baseDir:", baseDir);

  const mainPrompt = await loadPromptHbs(
    "outline.prompt",
    {
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

  const { thumbnail, outline, description } = await pRetry(
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

  console.info("[outline] success");
  return {
    _plan: {
      thumbnail,
      outline,
      description
    },
  };
}
