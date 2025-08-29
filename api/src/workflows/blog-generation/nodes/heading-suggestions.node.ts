import { StateAnnotation } from "../blog-generation.state";
import { z } from "zod";
import { HeadingNodeSchema } from "../schemas/node.schemas";
import { loadPromptHbs } from "../utils/load-prompt-hbs.util";
import path from "path";
import pRetry from "p-retry";
import { ChatOpenAI } from "@langchain/openai";
import { fileURLToPath } from "url";

const ResponseSchema = z.object({
  headings: z.array(HeadingNodeSchema).min(1),
});

export async function headingSuggestions(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[headingSuggestions] start");

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini-2024-07-18",
  }).withStructuredOutput(ResponseSchema, { strict: true });

  console.info("[headingSuggestions] LLM configured:", "gpt-4o-mini-2024-07-18");

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts"
  );
  const [editorStateSysPrompt, mainPrompt] = await Promise.all([
    loadPromptHbs("editor-state-system.prompt", undefined, { baseDir }),
    loadPromptHbs(
      "heading-suggestions.prompt",
      {
        minWords: state._metadata.blogLength.min,
        maxWords: state._metadata.blogLength.max,
      },
      { baseDir }
    ),
  ]);

  console.debug("[headingSuggestions] prompts loaded:", {
    editorStateSysPromptLen: editorStateSysPrompt?.length ?? 0,
    mainPromptLen: mainPrompt?.length ?? 0,
  });

  const metadataStr = JSON.stringify(state._metadata);
  console.debug(
    "[headingSuggestions] metadata size (bytes):",
    Buffer.byteLength(metadataStr, "utf8")
  );

  const t0 = Date.now();
  const { headings } = await pRetry(
    async () => {
      console.debug("[headingSuggestions] invoking LLM");
      const res = await llm.invoke([
        {
          type: "system",
          content: [editorStateSysPrompt, mainPrompt].join("\n"),
        },
        {
          type: "human",
          content: metadataStr,
        },
      ]);
      console.info(
        "[headingSuggestions] LLM completed in",
        Date.now() - t0,
        "ms"
      );
      return res;
    },
    {
      retries: 3,
      minTimeout: 3000,
      maxTimeout: 5000,
      onFailedAttempt: (context) =>
        console.warn(
          `[headingSuggestions] retry ${context.attemptNumber}/3 failed. Error: ${context.message}`
        ),
    }
  );

  if (!headings?.length) {
    console.error("[headingSuggestions] no headings returned");
    throw new Error(
      "Model returned no headings; revise heading-suggestions.prompt to enforce at least one."
    );
  }

  console.info(
    "[headingSuggestions] success. Headings count:",
    headings.length
  );
  console.debug("[headingSuggestions] first heading sample:", headings[0]);

  console.dir(headings)

  return {
    _headings: headings,
  };
}
