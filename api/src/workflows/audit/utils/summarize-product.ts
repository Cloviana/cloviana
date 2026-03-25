import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { ProductContext } from "../audit.types";

const groq = new GroqClient();

const SummarizeSchema = z.object({
  summary: z.string(),
  brandName: z.string(),
  icp: z.string(),
  category: z.string(),
});

export async function summarizeProduct(
  homepageText: string,
  domain: string,
): Promise<ProductContext> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("nodes/summarize-product", {}, { baseDir });

  return groq.chatJson<ProductContext>({
    name: "summarize-product",
    schema: SummarizeSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify({ domain, homepageText }) },
    ],
  });
}
