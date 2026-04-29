import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { z } from "zod";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";
import { ContentType } from "../audit.types";

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
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq } = requireAuditDependencies(config);
  const targetDomain =
    normalizeDomain(state.profile.domain) ?? state.profile.domain;

  const missedPrompts = [
    ...new Set(
      state.engineResponses
        .filter(
          (r) =>
            !r.mentions.some(
              (m) =>
                m.domain &&
                (normalizeDomain(m.domain) ?? m.domain) === targetDomain,
            ),
        )
        .map((r) => r.prompt),
    ),
  ].slice(0, 10);

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("generate-content-ideas", {}, { baseDir });

  const result = await groq.parse({
    name: "generate-content-ideas",
    schema: ContentIdeasSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          brandName: state.profile.name,
          domain: state.profile.domain,
          category: state.profile.category,
          icp: state.profile.icp,
          missedPrompts,
        }),
      },
    ],
  });

  return { contentIdeas: result.ideas };
}
