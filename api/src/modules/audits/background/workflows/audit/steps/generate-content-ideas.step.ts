import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { z } from "zod";
import {
  type AuditInput,
  CONTENT_TYPES,
  type ContentIdea,
  type EngineResult,
} from "../audit.types";

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);
const ContentIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        contentType: z.enum(CONTENT_TYPES),
        title: z.string(),
        overview: z.string(),
      }),
    )
    .length(4),
});

export async function generateContentIdeasStep(
  groq: GroqService,
  input: AuditInput,
  responses: EngineResult[],
): Promise<ContentIdea[]> {
  const targetDomain =
    normalizeDomain(input.profile.domain) ?? input.profile.domain;
  const missedPrompts = [
    ...new Set(
      responses
        .filter(
          (response) =>
            !response.mentions.some(
              (mention) =>
                (normalizeDomain(mention.domain) ?? mention.domain) ===
                targetDomain,
            ),
        )
        .map((response) => response.prompt),
    ),
  ].slice(0, 10);
  const system = await loadPromptHbs(
    "generate-content-ideas",
    {},
    { baseDir: PROMPT_DIRECTORY },
  );
  const result = await groq.parse({
    name: "generate-content-ideas",
    schema: ContentIdeasSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          brandName: input.profile.name,
          domain: input.profile.domain,
          category: input.profile.category,
          icp: input.profile.icp,
          missedPrompts,
        }),
      },
    ],
  });

  return result.ideas;
}
