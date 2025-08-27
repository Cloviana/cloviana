import { StateAnnotation } from "../blog-generation.state";
import { z } from "zod";
import { SectionSchema, ThumbnailSchema } from "../schemas/outline.schemas";
import path from "path";
import { loadPromptHbs } from "../utils/load-prompt-hbs.util";
import pRetry from "p-retry";
import { ChatOpenAI } from "@langchain/openai";

const ResponseSchema = z.object({
  thumbnail: ThumbnailSchema,
  sections: z.array(SectionSchema).min(1),
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
    model: "gpt-5-mini",
  }).withStructuredOutput(ResponseSchema, { strict: true });

  console.info("[outline] LLM configured:", "gpt-5-mini");

  const mainPromptPath = path.resolve(__dirname, "../prompts");
  console.debug("[outline] prompts baseDir:", mainPromptPath);

  const mainPrompt = await loadPromptHbs(
    "outline.prompt",
    {
      minWords: state._metadata.blogLength.min,
      maxWords: state._metadata.blogLength.max,
    },
    {
      baseDir: mainPromptPath,
    },
  );

  console.debug("[outline] prompt length:", mainPrompt?.length ?? 0);

  const headingsIdx = state._headings.map((h, i) => ({
    ...h,
    id: `heading-${i}`,
  }));
  console.debug("[outline] indexed headings:", headingsIdx.length);

  const payload = {
    metadata: state._metadata,
    headings: headingsIdx.map((h) => ({ id: h.id, heading: extractText(h) })),
  };

  const payloadStr = JSON.stringify(payload);
  console.debug(
    "[outline] payload size (bytes):",
    Buffer.byteLength(payloadStr, "utf8"),
  );
  console.debug("[outline] sample heading:", payload.headings?.[0]);

  const t0 = Date.now();

  const { thumbnail, sections } = await pRetry(
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
  console.debug("[outline] first section headingId:", sections[0]?.headingId);

  const mapped = sections.map((s) => {
    const match = headingsIdx.find((a) => a.id === s.headingId);
    if (!match) {
      console.error("[outline] missing heading for headingId:", s.headingId);
      throw new Error(`No heading found for headingId=${s.headingId}`);
    }
    const { id, ...heading } = match;
    return { ...s, heading };
  });

  console.info("[outline] mapping complete");
  console.debug("[outline] mapped sections count:", mapped.length);
  console.debug(
    "[outline] thumbnail prompt length:",
    thumbnail?.prompt?.length ?? 0,
  );

  const result = {
    _outline: {
      thumbnail,
      sections: mapped,
    },
  };

  console.info("[outline] success");
  return result;
}
