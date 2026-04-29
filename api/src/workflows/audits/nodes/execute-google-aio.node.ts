import { Brand, extractMentions } from "@/common/visibility/extract-mentions";
import { AiOverviewItem } from "@/integrations/dataforseo/dataforseo.types";
import pLimit from "p-limit";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";
import { EngineBrand, EngineResult, EngineSource } from "../audit.types";
import { getLocationCode } from "../utils/location-code";

const CONCURRENCY = 5;

export async function executeGoogleAio(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { dataForSeo, groq } = requireAuditDependencies(config);
  const locationCode = getLocationCode(state.country);
  const limit = pLimit(CONCURRENCY);
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
    state.prompts.map((prompt) =>
      limit(async (): Promise<EngineResult> => {
        try {
          const response = await dataForSeo.getGoogleSerpAiOverview({
            keyword: prompt.text,
            language_code: "en",
            location_code: locationCode,
          });

          const taskResult = response.tasks?.[0]?.result?.[0];
          const aiOverview = taskResult?.items?.find(
            (item): item is AiOverviewItem => item.type === "ai_overview",
          );
          const sources: EngineSource[] = (aiOverview?.references ?? [])
            .filter((reference) => Boolean(reference.url))
            .map((reference) => ({
              title: reference.title ?? "",
              url: reference.url,
              description: reference.text ?? "",
            }));
          const text = aiOverview?.markdown ?? "";
          const mentionDomains = await extractMentions(groq, text, brands);
          const mentions: EngineBrand[] = mentionDomains.map((domain) => ({
            domain,
            name: brandNameByDomain.get(domain) ?? domain,
          }));

          return {
            promptId: prompt.promptId,
            prompt: prompt.text,
            engine: "google-aio",
            text,
            sources,
            mentions,
          };
        } catch {
          return {
            promptId: prompt.promptId,
            prompt: prompt.text,
            engine: "google-aio",
            text: "",
            sources: [],
            mentions: [],
          };
        }
      }),
    ),
  );

  return { engineResponses };
}
