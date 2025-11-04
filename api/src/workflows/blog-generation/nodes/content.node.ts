import { StateAnnotation } from "@/workflows/blog-generation/blog-generation.state";
import { EditorStateSchema } from "@/workflows/blog-generation/schemas/node.schemas";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import Groq from "groq-sdk";
import pRetry from "p-retry";
import path from "path";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";

export async function content(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
    console.info("[content] start");
      console.debug("[content] metadata keys:", Object.keys(state._metadata ?? {}));
    
      const groq = new Groq();
    
      const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
      console.debug("[content] prompts baseDir:", baseDir);
    
      const [editorStateSysPrompt, mainPrompt] = await Promise.all([
        loadPromptHbs("editor-state-system.prompt", undefined, { baseDir }),
        loadPromptHbs("content.prompt", undefined, { baseDir }),
      ]);

      console.debug("[content] prompt length:", mainPrompt?.length ?? 0);
    
      const payload = {
    metadata: state._metadata,
    outline: state._plan.outline,
    title: state._plan.title,
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

          const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: [editorStateSysPrompt, mainPrompt].join("\n")
              },
              { 
                role: "user", 
                content: JSON.stringify(payload, null, 2)
              },
            ],
            reasoning_effort: "medium",
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "editorial_schema",
                schema: zodToJsonSchema(EditorStateSchema, "editorial_schema")
              }
            }
          });

          const rawResult = JSON.parse(response.choices[0].message.content || "{}");
          const result = EditorStateSchema.parse(rawResult);

          console.info(
            "[content] LLM invocation done in",
            Date.now() - invokeStart,
            "ms",
          );
          return result;
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