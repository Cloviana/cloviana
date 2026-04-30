import { getTitle } from "@/common/utils/get-title.util";
import { Brand, extractMentions } from "@/common/visibility/extract-mentions";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";
import { EngineBrand, EngineResult } from "../audit.types";

export async function executeChatgpt(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { openai, groq } = requireAuditDependencies(config);
  const brands: Brand[] = [
    { name: state.profile.name, domain: state.profile.domain },
    ...state.competitors.map((competitor) => ({
      name: competitor.name,
      domain: competitor.domain,
    })),
  ];
  const brandNameByDomain = new Map(
    brands.map((brand) => [brand.domain, brand.name]),
  );

  const engineResponses = await Promise.all(
    state.prompts.map(async (prompt): Promise<EngineResult | null> => {
      const result = await openai.create({
        name: "audit-chatgpt",
        model: "gpt-5.4-mini-2026-03-17",
        max_output_tokens: 4096,
        input: [{ role: "user" as const, content: prompt.text }],
        reasoning: { effort: "none" as const },
        tools: [
          {
            type: "web_search_preview" as const,
            search_context_size: "medium" as const,
            user_location: {
              type: "approximate" as const,
              country: state.country,
            },
          },
        ],
        tool_choice: { type: "web_search_preview" as const },
        include: ["web_search_call.action.sources" as const],
      });

      if (!result.content) {
        return null;
      }

      const mentionDomains = await extractMentions(
        groq,
        result.content,
        brands,
      );
      const mentions: EngineBrand[] = mentionDomains.map((domain) => ({
        domain,
        name: brandNameByDomain.get(domain) ?? domain,
      }));
      const sources = await Promise.all(
        result.citations.map(async (url) => ({
          url,
          title: await getTitle(url),
          description: "",
        })),
      );

      return {
        promptId: prompt.promptId,
        prompt: prompt.text,
        engine: "chatgpt",
        text: result.content,
        sources,
        mentions,
      };
    }),
  );

  return {
    engineResponses: engineResponses.filter(
      (response): response is EngineResult => response !== null,
    ),
  };
}
