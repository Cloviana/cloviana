import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import pLimit from "p-limit";
import { StateAnnotation } from "../audit.state";
import { EngineResult, EngineSource } from "../audit.types";
import { BrandRef, extractMentions } from "../utils/extract-mentions";

const CONCURRENCY = 30;

export async function executePerplexity(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const dataForSeo = configurable?.dataForSeo as DataForSeoService;
  if (!dataForSeo) throw new Error("DataForSeoService not provided");

  const logger = configurable?.logger as Logger;
  logger?.debug(`[perplexity] Running ${state._prompts.length} prompts`);

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
          const response = await dataForSeo.getPerplexityResponse({
            user_prompt: prompt.slice(0, 500),
            model_name: "sonar",
            max_output_tokens: 2048,
            web_search_country_iso_code: state._country,
          });

          const taskResult = response.tasks?.[0]?.result?.[0];
          if (!taskResult) {
            return { prompt, engine: "perplexity", text: "", sources: [], mentions: [] };
          }

          const section = taskResult.items?.[0]?.sections?.[0];
          const sources: EngineSource[] = (section?.annotations ?? [])
            .filter((a: any) => a.url)
            .map((a: any) => ({ title: a.title ?? "", url: a.url, description: "" }));

          const text = section?.text ?? "";
          const mentions = await extractMentions(text, brands);

          logger?.debug(`[perplexity] "${prompt.slice(0, 60)}..." → ${text.length} chars, ${mentions.length} mentions`);
          return { prompt, engine: "perplexity", text, sources, mentions };
        } catch (err) {
          logger?.debug(`[perplexity] "${prompt.slice(0, 60)}..." → error: ${err}`);
          return { prompt, engine: "perplexity", text: "", sources: [], mentions: [] };
        }
      }),
    ),
  );

  const withText = results.filter((r) => r.text.length > 0).length;
  logger?.debug(`[perplexity] Done: ${withText}/${results.length} with text`);

  return { _engineResults: results };
}
