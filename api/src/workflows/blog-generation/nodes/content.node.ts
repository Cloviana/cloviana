import path from "path";
import { fileURLToPath } from "url";
import { StateAnnotation } from "@/workflows/blog-generation/blog-generation.state";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import { markdownToEditorState } from "@/workflows/blog-generation/utils/markdown-to-editor-state";
import Groq from "groq-sdk";
import pRetry from "p-retry";

export async function content(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[content] start");
  console.debug("[content] metadata keys:", Object.keys(state._metadata ?? {}));

  const groq = new Groq();

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );
  console.debug("[content] prompts baseDir:", baseDir);

  const mainPrompt = await loadPromptHbs("content.prompt", undefined, {
    baseDir,
  });

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
            content: mainPrompt,
          },
          {
            role: "user",
            content: JSON.stringify(payload, null, 2),
          },
        ],
        reasoning_effort: "medium",
      });

      const markdown = response.choices[0]?.message?.content ?? "";
      const editorState = markdownToEditorState(markdown);

      console.info(
        "[content] LLM invocation done in",
        Date.now() - invokeStart,
        "ms",
      );
      return editorState;
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
    _nodes: root.children,
  };
}
