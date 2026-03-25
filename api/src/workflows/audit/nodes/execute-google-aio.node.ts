import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { AiOverviewItem } from "@/integrations/dataforseo/dataforseo.types";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import pLimit from "p-limit";
import { StateAnnotation } from "../audit.state";
import { EngineResult, EngineSource } from "../audit.types";
import { BrandRef, extractMentions } from "../utils/extract-mentions";
import { getLocationCode } from "../utils/location-code";

const CONCURRENCY = 30;

export async function executeGoogleAio(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const dataForSeo = configurable?.dataForSeo as DataForSeoService;
  if (!dataForSeo) throw new Error("DataForSeoService not provided");

  const logger = configurable?.logger as Logger;
  logger?.debug(`[google-aio] Running ${state._prompts.length} prompts`);

  const locationCode = getLocationCode(state._country);
  const limit = pLimit(CONCURRENCY);

  const brands: BrandRef[] = [
    { name: state._brandName, domain: state._domain },
    ...state._competitors
      .filter((c): c is { domain: string; title: string } => !!c.title)
      .map((c) => ({ name: c.title, domain: c.domain })),
  ];

  const results = await Promise.all(
    state._prompts.map((prompt) =>
      limit(async (): Promise<EngineResult> => {
        try {
          const response = await dataForSeo.getGoogleSerpAiOverview({
            keyword: prompt,
            language_code: "en",
            location_code: locationCode,
          });

          const taskResult = response.tasks?.[0]?.result?.[0];
          if (!taskResult) {
            return { prompt, engine: "google_aio", text: "", sources: [], mentions: [] };
          }

          const aiOverview = taskResult.items?.find(
            (item): item is AiOverviewItem => item.type === "ai_overview",
          );

          const sources: EngineSource[] = (aiOverview?.references ?? [])
            .filter((r: any) => r.url)
            .map((r: any) => ({ title: r.title ?? "", url: r.url, description: r.text ?? "" }));

          const text = aiOverview?.markdown ?? "";
          const mentions = await extractMentions(text, brands);

          logger?.debug(`[google-aio] "${prompt.slice(0, 60)}..." → ${text.length} chars, ${mentions.length} mentions`);
          return { prompt, engine: "google_aio", text, sources, mentions };
        } catch (err) {
          logger?.debug(`[google-aio] "${prompt.slice(0, 60)}..." → error: ${err}`);
          return { prompt, engine: "google_aio", text: "", sources: [], mentions: [] };
        }
      }),
    ),
  );

  const withText = results.filter((r) => r.text.length > 0).length;
  logger?.debug(`[google-aio] Done: ${withText}/${results.length} with text`);

  return { _engineResults: results };
}
