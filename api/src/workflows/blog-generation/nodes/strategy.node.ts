import path from "path";
import { fileURLToPath } from "url";
import { performance } from "node:perf_hooks";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { StateAnnotation } from "../blog-generation.state";
import {
  ContentStrategySchema,
} from "@/workflows/blog-generation/schemas/strategy.schema";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import pRetry from "p-retry";

export async function strategy(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts"
  );

  const mainPrompt = await loadPromptHbs(
    "strategy",
    { context: state._context },
    { baseDir }
  );

  const llm = new ChatOpenAI({
    model: "gpt-4.1-mini"
  });

  const llmWithStructure = llm.withStructuredOutput(ContentStrategySchema);

  const start = performance.now();

  const _strategy = await pRetry(
    async () => {
      return await llmWithStructure.invoke([
        new SystemMessage(mainPrompt),
        new HumanMessage(JSON.stringify(state._context)),
      ]);
    },
    { retries: 3, minTimeout: 10000, maxTimeout: 60000, factor: 2 }
  );

  const end = performance.now();
  const durationMs = end - start;

  console.log(`Strategy generation took ${durationMs.toFixed(2)} ms`);
  console.log(JSON.stringify(_strategy));

  return { _strategy };
}
