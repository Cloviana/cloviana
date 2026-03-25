import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { StateAnnotation } from "../audit.state";
import { ContentType } from "../audit.types";
import { normalizeDomain } from "../utils/normalize-domain";

const groq = new GroqClient();

const ContentIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        contentType: z.enum(ContentType),
        title: z.string(),
        overview: z.string(),
      }),
    )
    .length(4),
});

export async function generateContentIdeas(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const logger = configurable?.logger as Logger;
  const targetDomain = normalizeDomain(state._domain) ?? state._domain;

  const missedPrompts = [
    ...new Set(
      state._engineResults
        .filter((r) =>
          !r.mentions.some(
            (m) => m.domain && (normalizeDomain(m.domain) ?? m.domain) === targetDomain,
          ),
        )
        .map((r) => r.prompt),
    ),
  ].slice(0, 10);

  logger?.debug(`[generate-content-ideas] ${missedPrompts.length} missed prompts for ${targetDomain}`);

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs(
    "nodes/generate-content-ideas",
    {
      brandName: state._brandName,
      domain: state._domain,
      icp: state._product.icp,
      category: state._product.category,
      missedPrompts,
    },
    { baseDir },
  );

  const result = await groq.chatJson<z.infer<typeof ContentIdeasSchema>>({
    name: "generate-content-ideas",
    schema: ContentIdeasSchema,
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
  });

  logger?.debug(`[generate-content-ideas] Generated ${result.ideas.length} ideas`);
  result.ideas.forEach((idea) => logger?.debug(`[generate-content-ideas]   - [${idea.contentType}] ${idea.title}`));

  return { _contentIdeas: result.ideas };
}
