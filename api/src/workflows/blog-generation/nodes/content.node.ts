
import { StateAnnotation } from "@/workflows/blog-generation/blog-generation.state";
import { EditorStateSchema } from "@/workflows/blog-generation/schemas/node.schemas";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import { ChatOpenAI } from "@langchain/openai";
import pRetry from "p-retry";
import path from "path";
import { fileURLToPath } from "url";

export async function content(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
    console.info("[content] start");
      console.debug("[content] metadata keys:", Object.keys(state._metadata ?? {}));
    
      const llm = new ChatOpenAI({
        model: "gpt-5-mini",
        reasoning: { effort: "medium" }
      }).withStructuredOutput(EditorStateSchema, { strict: true });
    
      const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
      console.debug("[content] prompts baseDir:", baseDir);
    
      const [editorStateSysPrompt, mainPrompt] = await Promise.all([
        loadPromptHbs("editor-state-system.prompt", undefined, { baseDir }),
        loadPromptHbs("content.prompt", undefined, { baseDir }),
      ]);

      console.debug("[content] prompt length:", mainPrompt?.length ?? 0);
    
      const payload = {
        metadata: state._metadata,
        outline: state._plan.outline
      };
    
      const payloadStr = JSON.stringify(payload);
      console.debug(
        "[content] payload size (bytes):",
        Buffer.byteLength(payloadStr, "utf8"),
      );
    
      const t0 = Date.now();
    
      const { root } = await pRetry(
        async () => {
          console.info("[content] invoking LLM");
          const invokeStart = Date.now();
          const res = await llm.invoke([
            { type: "system", content: [editorStateSysPrompt, mainPrompt].join("\n") },
            { type: "human", content: JSON.stringify(payload, null, 2) },
          ]);
          console.info(
            "[content] LLM invocation done in",
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
              `[content] retry ${context.attemptNumber} failed; retries left: ${context.retriesLeft}; error:`,
              context.message,
            );
          },
        },
      );
    
      console.info("[content] total latency:", Date.now() - t0, "ms");
    
      console.info("[content] success");
      return {
        _nodes: root.children
      };
}