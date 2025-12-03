import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import pRetry from "p-retry";
import { zodToJsonSchema } from "zod-to-json-schema";
import { StateAnnotation } from "../blog-generation.state";
import {
  PlanSchema,
} from "../schemas/outline.schemas";
import { loadPromptHbs } from "../utils/load-prompt-hbs.util";

export async function outline(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[outline] start");
  console.debug("[outline] metadata keys:", Object.keys(state._metadata ?? {}));

  const groq = new Groq();

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );
  console.debug("[outline] prompts baseDir:", baseDir);

  const payload = {
    metadata: state._metadata,
  };

  const payloadStr = JSON.stringify(payload);
  console.debug(
    "[outline] payload size (bytes):",
    Buffer.byteLength(payloadStr, "utf8"),
  );

  const mainPrompt = await loadPromptHbs("outline.prompt", payload, { baseDir });
  console.log(mainPrompt)
  console.debug("[outline] prompt length:", mainPrompt?.length ?? 0);


  const t0 = Date.now();

  const _plan = await pRetry(
    async () => {
      console.info("[outline] invoking LLM");
      const invokeStart = Date.now();

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: mainPrompt },
          { role: "user", content: JSON.stringify(payload, null, 2) },
        ],
        reasoning_effort: "medium",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "outline_schema",
            schema: zodToJsonSchema(PlanSchema, "outline_schema"),
          },
        },
      });

      const raw = JSON.parse(response.choices[0].message.content || "{}");
      const parsed = PlanSchema.parse(raw);

      console.info(
        "[outline] LLM invocation done in",
        Date.now() - invokeStart,
        "ms",
      );
      return parsed;
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
    _plan,
  };
}
