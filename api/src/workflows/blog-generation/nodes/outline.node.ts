import path from "path";
import { fileURLToPath } from "url";
import pRetry from "p-retry";
import { StateAnnotation } from "../blog-generation.state";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain";
import { OutlineSchema } from "@/workflows/blog-generation/schemas/outline.schemas";
import { materializeOutlineImages } from "@/workflows/blog-generation/utils/image-generation.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { StorageService } from "@/infrastructure/storage/storage.service";

export async function outline(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig
): Promise<Partial<typeof StateAnnotation.State>> {
  const storage = configurable?.storage as StorageService
  if (!storage) throw new Error("Storage service not provided");

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts"
  );

  const partialsDir = path.join(baseDir, "partials");

  const mainPrompt = await loadPromptHbs(
    "outline",
    { context: state._context },
    { baseDir, partialsDir }
  );

  const llm = new ChatOpenAI({
    model: "gpt-5-mini",
    reasoning: { effort: "low" },
  });

  const llmWithStructure = llm.withStructuredOutput(OutlineSchema);

  const start = performance.now();

  const _outlineRaw = await pRetry(
    async () => {
      return OutlineSchema.parse(
        await llmWithStructure.invoke([
          new SystemMessage(mainPrompt),
          new HumanMessage(
            JSON.stringify({
              context: state._context,
              strategy: state._strategy,
            })
          ),
        ])
      );
    },
    { retries: 3, minTimeout: 10000, maxTimeout: 60000, factor: 2, onFailedAttempt: (err) => {
        console.error("[outline] attempt failed", {
          attemptNumber: err.attemptNumber,
          retriesLeft: err.retriesLeft,
          error: err,
        });
      },
 }
  );

  const _outline = await materializeOutlineImages({
    outline: _outlineRaw,
    context: state._context,
    model: "gemini-3-pro-image-preview",
    storage,
    blogId: state._blogId,
  });

  const end = performance.now();
  const durationMs = end - start;

  console.log(`Outline generation took ${durationMs.toFixed(2)} ms`);
  console.log(JSON.stringify(_outline));

  return { _outline };
}
