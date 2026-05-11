import { getTitle } from "@/common/utils/get-title.util";
import { Brand, extractMentions } from "@/common/visibility/extract-mentions";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";
import { EngineBrand, EngineResult } from "../audit.types";

export async function executePerplexity(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { perplexity, groq } = requireAuditDependencies(config);
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
    state.prompts.map(async (prompt): Promise<EngineResult> => {
      try {
        const result = await perplexity.create({
          model: "sonar",
          reasoning_effort: "medium",
          temperature: 0,
          messages: [{ role: "user", content: prompt.text }],
          web_search_options: {
            user_location: {
              country: state.country,
            },
          },
        });
        const sources = await Promise.all(
          result.citations.map(async (url) => ({
            url,
            title: await getTitle(url),
            description: "",
          })),
        );
        const mentionDomains = await extractMentions(
          groq,
          result.content,
          brands,
        );
        const mentions: EngineBrand[] = mentionDomains.map((domain) => ({
          domain,
          name: brandNameByDomain.get(domain) ?? domain,
        }));

        return {
          promptId: prompt.promptId,
          prompt: prompt.text,
          engine: "perplexity",
          text: result.content,
          sources,
          mentions,
        };
      } catch {
        return {
          promptId: prompt.promptId,
          prompt: prompt.text,
          engine: "perplexity",
          text: "",
          sources: [],
          mentions: [],
        };
      }
    }),
  );

  return { engineResponses };
}
